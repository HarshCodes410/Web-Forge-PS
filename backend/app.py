import base64
import io
import os
import time
import cv2
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from torchvision import transforms, models
from PIL import Image

app = FastAPI(
    title="LeafVision PhenoBench Phenotyping & Classifier API",
    description="ResNet-50 Deep Learning Crop vs Weed Classifier combined with Computer Vision Leaf Instance Segmentation, Leaf Counting, Leaf Area Measurement, and Healthy/Damage Quantification.",
    version="2.2.0",
)

# Enable CORS for Frontend (Vercel & localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Recreate model architecture
weights = models.ResNet50_Weights.DEFAULT
model = models.resnet50(weights=weights)
num_classes = 2
model.fc = nn.Sequential(
    nn.Linear(model.fc.in_features, 256),
    nn.ReLU(),
    nn.Dropout(0.4),
    nn.Linear(256, num_classes),
)

# Load saved weights relative to this file
MODEL_PATH = os.path.join(os.path.dirname(__file__), "resnet50_phenobench.pth")
if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device("cpu")))
    model.eval()
else:
    print(f"Warning: Model weights file not found at {MODEL_PATH}")

# Image preprocessing matching training pipeline
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

CLASS_NAMES = ["Crop", "Weed"]

# Palette of distinct vibrant hues for leaf instance segmentation
LEAF_PALETTE = [
    {"name": "Emerald", "hex": "#10b981", "rgb": (16, 185, 129)},
    {"name": "Cyan", "hex": "#06b6d4", "rgb": (6, 182, 212)},
    {"name": "Purple", "hex": "#a855f7", "rgb": (168, 85, 247)},
    {"name": "Orange", "hex": "#f97316", "rgb": (249, 115, 22)},
    {"name": "Pink", "hex": "#ec4899", "rgb": (236, 72, 153)},
    {"name": "Yellow", "hex": "#eab308", "rgb": (234, 179, 8)},
    {"name": "Blue", "hex": "#3b82f6", "rgb": (59, 130, 246)},
    {"name": "Lime", "hex": "#84cc16", "rgb": (132, 204, 22)},
    {"name": "Rose", "hex": "#f43f5e", "rgb": (244, 63, 94)},
    {"name": "Teal", "hex": "#14b8a6", "rgb": (20, 184, 166)},
    {"name": "Violet", "hex": "#8b5cf6", "rgb": (139, 92, 246)},
    {"name": "Amber", "hex": "#f59e0b", "rgb": (245, 158, 11)},
]

def to_base64_data_uri(img_rgb: np.ndarray) -> str:
    pil_img = Image.fromarray(img_rgb)
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def analyze_plant_phenotyping(image_cv: np.ndarray):
    """
    Performs:
    1. Leaf Instance Segmentation & Distinct Coloring
    2. Leaf Counting
    3. Leaf Surface Area (Total, Per-Leaf, Canopy %)
    4. Leaf Damage / Necrosis Area Detection & Healthy Area Quantification
    """
    h, w = image_cv.shape[:2]
    total_pixels = h * w

    rgb = cv2.cvtColor(image_cv, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(image_cv, cv2.COLOR_BGR2HSV)

    # 1. Vegetation / Canopy Segmentation via Excess Green Index (ExG) and HSV
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    exg = 2 * g - r - b

    exg_norm = cv2.normalize(exg, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    _, thresh_exg = cv2.threshold(exg_norm, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    lower_green = np.array([25, 30, 30])
    upper_green = np.array([95, 255, 255])
    mask_hsv = cv2.inRange(hsv, lower_green, upper_green)

    plant_mask = cv2.bitwise_or(thresh_exg, mask_hsv)

    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    kernel_med = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    plant_mask = cv2.morphologyEx(plant_mask, cv2.MORPH_OPEN, kernel_small, iterations=2)
    plant_mask = cv2.morphologyEx(plant_mask, cv2.MORPH_CLOSE, kernel_med, iterations=1)

    total_leaf_pixels = int(np.sum(plant_mask > 0))
    if total_leaf_pixels < 100:
        return {
            "leaf_count": 0,
            "total_leaf_area_pixels": 0,
            "canopy_coverage_pct": 0.0,
            "healthy_area_pixels": 0,
            "healthy_percentage": 100.0,
            "damaged_area_pixels": 0,
            "damage_percentage": 0.0,
            "health_result": "Result: Healthy",
            "damage_severity": "Healthy",
            "leaves": [],
            "colored_overlay_image": to_base64_data_uri(rgb),
            "damage_overlay_image": to_base64_data_uri(rgb),
        }

    # 2. Leaf Instance Separation via Distance Transform + Watershed
    dist_transform = cv2.distanceTransform(plant_mask, cv2.DIST_L2, 5)
    max_val = dist_transform.max()
    threshold_ratio = 0.25 if max_val > 10 else 0.15
    _, sure_fg = cv2.threshold(dist_transform, threshold_ratio * max_val, 255, 0)
    sure_fg = np.uint8(sure_fg)

    sure_bg = cv2.dilate(plant_mask, kernel_med, iterations=3)
    unknown = cv2.subtract(sure_bg, sure_fg)

    num_markers, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0

    markers = cv2.watershed(image_cv, markers)

    # 3. Coloring each distinct leaf instance
    instance_overlay = rgb.copy()
    colored_mask = np.zeros_like(rgb)
    leaves_data = []

    unique_markers = [m for m in np.unique(markers) if m > 1]
    min_leaf_area = 150
    marker_areas = [(m, int(np.sum(markers == m))) for m in unique_markers]
    marker_areas = [m for m in marker_areas if m[1] >= min_leaf_area]
    marker_areas.sort(key=lambda x: x[1], reverse=True)

    leaf_idx = 1
    for m_id, leaf_area in marker_areas:
        color_entry = LEAF_PALETTE[(leaf_idx - 1) % len(LEAF_PALETTE)]
        color_rgb = color_entry["rgb"]

        leaf_mask = (markers == m_id).astype(np.uint8)
        colored_mask[leaf_mask > 0] = color_rgb

        moments = cv2.moments(leaf_mask)
        cx, cy = 0, 0
        if moments["m00"] > 0:
            cx = int(moments["m10"] / moments["m00"])
            cy = int(moments["m01"] / moments["m00"])

        x, y, w_box, h_box = cv2.boundingRect(leaf_mask)

        # Estimate damage on this specific leaf
        leaf_hsv = hsv[leaf_mask > 0]
        leaf_green = (leaf_hsv[:, 0] >= 32) & (leaf_hsv[:, 0] <= 85) & (leaf_hsv[:, 1] >= 35) & (leaf_hsv[:, 2] >= 35)
        leaf_damaged_px = int(np.sum(~leaf_green))
        leaf_damage_pct = round((leaf_damaged_px / max(1, leaf_area)) * 100, 1)

        leaves_data.append({
            "id": leaf_idx,
            "color": color_entry["hex"],
            "color_name": color_entry["name"],
            "area_pixels": leaf_area,
            "percentage_of_canopy": round((leaf_area / total_leaf_pixels) * 100, 1),
            "damage_percentage": leaf_damage_pct,
            "bounding_box": {"x": x, "y": y, "width": w_box, "height": h_box},
            "centroid": {"x": cx, "y": cy},
        })
        leaf_idx += 1

    leaf_count = len(leaves_data)

    # Blend colored instance mask onto original image
    has_instances = (colored_mask > 0).any(axis=2)
    instance_overlay[has_instances] = cv2.addWeighted(
        rgb[has_instances], 0.45, colored_mask[has_instances], 0.55, 0
    )

    # Draw crisp borders between touching leaves
    instance_overlay[markers == -1] = [255, 255, 255]

    # Draw numbered centroid badges
    for leaf in leaves_data:
        cx, cy = leaf["centroid"]["x"], leaf["centroid"]["y"]
        if cx > 0 and cy > 0:
            cv2.circle(instance_overlay, (cx, cy), 14, (15, 20, 18), -1)
            cv2.circle(instance_overlay, (cx, cy), 14, (255, 255, 255), 1)
            cv2.putText(
                instance_overlay,
                str(leaf["id"]),
                (cx - (4 if leaf["id"] < 10 else 8), cy + 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                (255, 255, 255),
                1,
                cv2.LINE_AA,
            )

    # 4. Damage / Lesion Analysis across Canopy & Healthy Area
    h_channel = hsv[:, :, 0]
    s_channel = hsv[:, :, 1]
    v_channel = hsv[:, :, 2]

    healthy_green = (h_channel >= 32) & (h_channel <= 85) & (s_channel >= 35) & (v_channel >= 35) & (plant_mask > 0)
    is_damage = (plant_mask > 0) & (~healthy_green)
    is_damage = cv2.morphologyEx(is_damage.astype(np.uint8), cv2.MORPH_OPEN, kernel_small)

    damaged_pixels = int(np.sum(is_damage > 0))
    healthy_pixels = max(0, total_leaf_pixels - damaged_pixels)
    damage_pct = round((damaged_pixels / max(1, total_leaf_pixels)) * 100, 2)
    healthy_pct = round((healthy_pixels / max(1, total_leaf_pixels)) * 100, 2)

    if damage_pct < 2.0:
        severity = "Healthy"
    elif damage_pct < 8.0:
        severity = "Low Damage"
    elif damage_pct < 20.0:
        severity = "Moderate Damage"
    else:
        severity = "Severe Damage"

    health_result = "Result: Healthy" if damage_pct < 5.0 else f"Result: {severity}"

    # Damage Heatmap Overlay
    damage_overlay = rgb.copy()
    bg_mask = (plant_mask == 0)
    damage_overlay[bg_mask] = (damage_overlay[bg_mask] * 0.4).astype(np.uint8)

    damage_overlay[healthy_green] = cv2.addWeighted(
        rgb[healthy_green], 0.65, np.full_like(rgb[healthy_green], [34, 197, 94]), 0.35, 0
    )

    damage_mask_bool = (is_damage > 0)
    if np.any(damage_mask_bool):
        damage_overlay[damage_mask_bool] = cv2.addWeighted(
            rgb[damage_mask_bool], 0.25, np.full_like(rgb[damage_mask_bool], [239, 68, 68]), 0.75, 0
        )

    return {
        "leaf_count": leaf_count,
        "total_leaf_area_pixels": total_leaf_pixels,
        "canopy_coverage_pct": round((total_leaf_pixels / total_pixels) * 100, 2),
        # Health & Damage Area Quantification
        "healthy_area_pixels": healthy_pixels,
        "healthy_percentage": healthy_pct,
        "damaged_area_pixels": damaged_pixels,
        "damage_percentage": damage_pct,
        "health_result": health_result,
        "damage_severity": severity,
        "leaves": leaves_data,
        "colored_overlay_image": to_base64_data_uri(instance_overlay),
        "damage_overlay_image": to_base64_data_uri(damage_overlay),
    }

@app.get("/")
def home():
    return {
        "status": "ready",
        "service": "LeafVision PhenoBench Phenotyping API",
        "model": "ResNet-50 PhenoBench",
        "capabilities": [
            "Crop vs Weed Classification",
            "Leaf Counting",
            "Leaf Instance Segmentation (Distinct Leaf Coloring)",
            "Leaf Surface Area Quantification",
            "Leaf Damage & Healthy Area Detection",
        ],
        "classes": CLASS_NAMES,
    }

@app.get("/health")
def health():
    return {
        "status": "online",
        "model": "ResNet-50 PhenoBench",
        "version": "2.2.0",
        "capabilities": [
            "classification",
            "leaf_counting",
            "leaf_coloring",
            "leaf_area",
            "damage_detection",
        ],
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        start_time = time.perf_counter()
        image_bytes = await file.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = preprocess(pil_image).unsqueeze(0)

        # 1. Deep Learning Classification (ResNet-50)
        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.softmax(outputs, dim=1)[0]
            confidence, predicted = torch.max(probs, 0)

        class_id = predicted.item()
        prediction_label = CLASS_NAMES[class_id]

        # 2. Computer Vision Phenotyping Engine
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        phenotyping_result = analyze_plant_phenotyping(cv_image)

        inference_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "status": "success",
            "class_id": class_id,
            "prediction": prediction_label,
            "confidence": round(confidence.item(), 4),
            "probabilities": {
                "Crop": round(probs[0].item(), 4),
                "Weed": round(probs[1].item(), 4),
            },
            # Phenotyping features
            "leaf_count": phenotyping_result["leaf_count"],
            "total_leaf_area_pixels": phenotyping_result["total_leaf_area_pixels"],
            "canopy_coverage_pct": phenotyping_result["canopy_coverage_pct"],
            # Health & Damage Area
            "healthy_area_pixels": phenotyping_result["healthy_area_pixels"],
            "healthy_percentage": phenotyping_result["healthy_percentage"],
            "damaged_area_pixels": phenotyping_result["damaged_area_pixels"],
            "damage_percentage": phenotyping_result["damage_percentage"],
            "health_result": phenotyping_result["health_result"],
            "damage_severity": phenotyping_result["damage_severity"],
            "leaves": phenotyping_result["leaves"],
            "colored_overlay_image": phenotyping_result["colored_overlay_image"],
            "damage_overlay_image": phenotyping_result["damage_overlay_image"],
            # Result image defaults to colored overlay
            "result_image": phenotyping_result["colored_overlay_image"],
            "inference_ms": inference_ms,
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    uvicorn.run("app:app", host="0.0.0.0", port=port, app_dir=backend_dir, reload=False)
