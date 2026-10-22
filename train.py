"""
Web Forge 2026 // PS 07 - Mask R-CNN Training Pipeline
======================================================
Trains Mask R-CNN (ResNet-50 FPN) for leaf instance segmentation on PhenoBench / Plant dataset.
Saves weights directly to: best_leaf_maskrcnn.pth
"""

import os
import sys
import time
import zipfile
import glob
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

import torch
import torchvision
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms.functional as TF
from torchvision.models.detection import maskrcnn_resnet50_fpn, MaskRCNN_ResNet50_FPN_Weights
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor


def extract_instances_from_image(img_np):
    """
    Extracts individual leaf masks, bounding boxes, and labels using
    precision Excess Green (ExG) + Topological Watershed.
    Used for pseudo-labeling if ground-truth annotation masks are not provided.
    """
    h, w, _ = img_np.shape
    img_f = img_np.astype(np.float32)
    exg = 2.0 * img_f[:, :, 1] - img_f[:, :, 0] - img_f[:, :, 2]
    exg_norm = cv2.normalize(exg, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    _, mask_exg = cv2.threshold(exg_norm, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
    mask_hsv = cv2.inRange(hsv, np.array([18, 25, 25]), np.array([105, 255, 255]))
    mask_plant = cv2.bitwise_or(mask_exg, mask_hsv)
    
    k_sm = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    k_med = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    clean_mask = cv2.morphologyEx(mask_plant, cv2.MORPH_OPEN, k_sm, iterations=1)
    clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, k_med, iterations=3)

    dist = cv2.distanceTransform(clean_mask, cv2.DIST_L2, 5)
    k_size = max(15, int(min(h, w) * 0.08))
    if k_size % 2 == 0:
        k_size += 1
    k_peak = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
    local_max = cv2.dilate(dist, k_peak)

    peaks = (dist == local_max) & (dist > 0.28 * dist.max())
    sure_fg = cv2.dilate(peaks.astype(np.uint8) * 255, k_sm, iterations=2)
    sure_bg = cv2.dilate(clean_mask, k_sm, iterations=3)
    unknown = cv2.subtract(sure_bg, sure_fg)

    num_markers, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0
    markers = cv2.watershed(img_np, markers)

    min_area = (h * w) * 0.03
    boxes, masks = [], []

    for m_id in np.unique(markers):
        if m_id <= 1:
            continue
        bin_m = (markers == m_id).astype(np.uint8)
        if bin_m.sum() < min_area:
            continue
        cnts, _ = cv2.findContours(bin_m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        if not cnts:
            continue
        c = max(cnts, key=cv2.contourArea)
        x, y, bw, bh = cv2.boundingRect(c)
        if bw < 5 or bh < 5:
            continue

        solid = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(solid, [c], -1, 1, -1)
        boxes.append([x, y, x + bw, y + bh])
        masks.append(solid)

    return boxes, masks


class PhenoBenchLeafDataset(Dataset):
    """
    Dataset loader for PhenoBench / Plant Canopy images.
    Supports either pre-existing mask PNGs or on-the-fly pseudo annotations.
    """
    def __init__(self, image_paths, mask_dir=None):
        self.image_paths = image_paths
        self.mask_dir = mask_dir

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        img_pil = Image.open(img_path).convert("RGB")
        img_np = np.array(img_pil)
        h, w, _ = img_np.shape

        boxes = []
        masks = []

        # Check if ground truth mask directory exists
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        mask_file = None
        if self.mask_dir and os.path.isdir(self.mask_dir):
            for ext in ['.png', '.jpg']:
                cand = os.path.join(self.mask_dir, base_name + ext)
                if os.path.exists(cand):
                    mask_file = cand
                    break

        if mask_file:
            # Load ground truth instance mask (each pixel value = instance ID)
            m_img = np.array(Image.open(mask_file))
            inst_ids = np.unique(m_img)
            for i_id in inst_ids:
                if i_id == 0:
                    continue  # background
                b_mask = (m_img == i_id).astype(np.uint8)
                pos = np.where(b_mask)
                if len(pos[0]) == 0:
                    continue
                xmin, xmax = np.min(pos[1]), np.max(pos[1])
                ymin, ymax = np.min(pos[0]), np.max(pos[0])
                if (xmax - xmin) > 4 and (ymax - ymin) > 4:
                    boxes.append([xmin, ymin, xmax, ymax])
                    masks.append(b_mask)
        else:
            # Use high-fidelity topological extraction
            boxes, masks = extract_instances_from_image(img_np)

        # Fallback if no leaves were detected in an image
        if len(boxes) == 0:
            boxes = [[0, 0, w, h]]
            masks = [np.ones((h, w), dtype=np.uint8)]

        boxes = torch.as_tensor(boxes, dtype=torch.float32)
        labels = torch.ones((len(boxes),), dtype=torch.int64)  # 1 = Leaf
        masks = torch.as_tensor(np.array(masks), dtype=torch.uint8)
        image_id = torch.tensor([idx])
        area = (boxes[:, 3] - boxes[:, 1]) * (boxes[:, 2] - boxes[:, 0])
        iscrowd = torch.zeros((len(boxes),), dtype=torch.int64)

        target = {
            "boxes": boxes,
            "labels": labels,
            "masks": masks,
            "image_id": image_id,
            "area": area,
            "iscrowd": iscrowd
        }

        # Convert image to tensor normalized [0, 1]
        img_tensor = TF.to_tensor(img_pil)

        return img_tensor, target


def collate_fn(batch):
    return tuple(zip(*batch))


def build_maskrcnn_model(num_classes=2):
    """
    Builds Mask R-CNN with ResNet-50 FPN backbone fine-tuned for 2 classes (Background + Leaf)
    """
    weights = MaskRCNN_ResNet50_FPN_Weights.DEFAULT
    model = maskrcnn_resnet50_fpn(weights=weights)

    # 1. Replace Box Predictor
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

    # 2. Replace Mask Predictor
    in_features_mask = model.roi_heads.mask_predictor.conv5_mask.in_channels
    model.roi_heads.mask_predictor = MaskRCNNPredictor(in_features_mask, 256, num_classes)

    return model


def prepare_data(data_zip="phenobench_1k_images.zip", extract_dir="dataset_phenobench"):
    """
    Unzips dataset if not already unzipped and returns list of image files.
    """
    if not os.path.exists(extract_dir):
        if os.path.exists(data_zip):
            print(f"📦 Extracting {data_zip} into {extract_dir}...")
            os.makedirs(extract_dir, exist_ok=True)
            with zipfile.ZipFile(data_zip, 'r') as z:
                z.extractall(extract_dir)
            print(f"✅ Extraction completed!")
        else:
            print(f"⚠️ {data_zip} not found in current folder.")

    # Search for all image files recursively
    imgs = []
    for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.PNG"]:
        imgs.extend(glob.glob(os.path.join(extract_dir, "**", ext), recursive=True))

    print(f"🌿 Total images discovered for training: {len(imgs)}")
    return imgs


def train_model(epochs=10, batch_size=2, lr=0.005, output_weights="best_leaf_maskrcnn.pth"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n=======================================================")
    print(f"🍃 WEB FORGE 2026 // MASK R-CNN TRAINING PIPELINE")
    print(f"=======================================================")
    print(f"• Hardware Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")
    print(f"• Epochs: {epochs}")
    print(f"• Batch Size: {batch_size}")
    print(f"• Target Output: {output_weights}")
    print(f"=======================================================\n")

    # 1. Prepare Dataset
    images = prepare_data()
    if len(images) == 0:
        print("❌ No images found. Place phenobench_1k_images.zip or an images folder in this directory.")
        return

    # Use first 300-500 images for fast high-accuracy convergence if running locally
    max_train_samples = min(len(images), 500)
    train_images = images[:max_train_samples]
    print(f"⚡ Using {len(train_images)} images for fine-tuning...")

    dataset = PhenoBenchLeafDataset(train_images)
    data_loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        collate_fn=collate_fn,
        num_workers=0,
        pin_memory=torch.cuda.is_available()
    )

    # 2. Build Model
    print("⏳ Initializing Mask R-CNN (ResNet-50 FPN) with custom heads...")
    model = build_maskrcnn_model(num_classes=2).to(device)

    # 3. Optimizer & Learning Rate Scheduler
    params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.SGD(params, lr=lr, momentum=0.9, weight_decay=0.0005)
    lr_scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.1)

    # 4. Training Loop
    best_loss = float("inf")
    start_total_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        epoch_loss = 0.0
        start_time = time.time()

        for batch_idx, (imgs_batch, targets_batch) in enumerate(data_loader):
            imgs_batch = [img.to(device) for img in imgs_batch]
            targets_batch = [{k: v.to(device) for k, v in t.items()} for t in targets_batch]

            # Forward pass (computes multi-task losses)
            loss_dict = model(imgs_batch, targets_batch)
            losses = sum(loss for loss in loss_dict.values())

            # Backward & Step
            optimizer.zero_grad()
            losses.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=10.0)
            optimizer.step()

            epoch_loss += losses.item()

            if (batch_idx + 1) % 20 == 0 or (batch_idx + 1) == len(data_loader):
                loss_breakdown = " | ".join([f"{k[:6]}: {v.item():.3f}" for k, v in loss_dict.items()])
                print(f"  Epoch [{epoch}/{epochs}] Batch [{batch_idx + 1}/{len(data_loader)}] Loss: {losses.item():.4f} ({loss_breakdown})")

        lr_scheduler.step()
        avg_loss = epoch_loss / len(data_loader)
        duration = time.time() - start_time
        print(f"📊 >>> Epoch {epoch}/{epochs} Complete — Avg Loss: {avg_loss:.4f} — Time: {duration:.1f}s")

        # Save Best Weights Checkpoint
        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save(model.state_dict(), output_weights)
            print(f"  🌟 New Best Model Saved to: {output_weights} (Loss: {best_loss:.4f})")

    total_duration = time.time() - start_total_time
    print(f"\n=======================================================")
    print(f"🏆 TRAINING COMPLETED SUCCESSFULLY in {total_duration / 60:.2f} mins!")
    print(f"💾 Trained Weights: {os.path.abspath(output_weights)}")
    print(f"⚡ To run inference: server.py will now automatically load {output_weights}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    # Command line options
    import argparse
    parser = argparse.ArgumentParser(description="Train Mask R-CNN on PhenoBench")
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs to train (default: 5)")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size (default: 2)")
    parser.add_argument("--lr", type=float, default=0.005, help="Learning rate (default: 0.005)")
    args = parser.parse_args()

    train_model(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
