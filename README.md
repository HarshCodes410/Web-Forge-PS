# 🍃 LeafVision // AI Plant Phenotyping & Leaf Instance Segmentation

> **Web Forge 2026 — Problem Statement 07**  
> **Team Web Forge** | Maulana Azad National Institute of Technology (MANIT Bhopal)  
> **Domain:** Artificial Intelligence / Computer Vision / Precision Agriculture  

[![Web Forge 2026](https://img.shields.io/badge/Web%20Forge-PS%2007-10b981.svg?style=flat-square)](https://github.com/HarshCodes410/Web-Forge-PS)
[![Framework](https://img.shields.io/badge/Next.js-16%20App%20Router-black.svg?style=flat-square&logo=next.js)](https://nextjs.org)
[![Backend](https://img.shields.io/badge/FastAPI-PyTorch%20CUDA-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Model](https://img.shields.io/badge/Model-Mask%20R--CNN%20(ResNet--50--FPN)-792ee5.svg?style=flat-square)](https://arxiv.org/abs/1703.06870)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🌾 The Challenge: Why Leaf Segmentation Matters

In modern precision agriculture and plant phenotyping, farmers and agronomists need accurate leaf metrics to track crop growth velocity, detect diseases before visible wilting occurs, and automate targeted weed spraying.

However, capturing these metrics directly in outdoor field conditions is notoriously difficult:
* **Overlapping foliage & self-occlusion:** Touching leaves blend together into a continuous green canopy.
* **Complex field illumination:** Direct sunlight, harsh specular highlights, and dark cast shadows confuse traditional RGB color filters.
* **Background soil & weed clutter:** Soil, organic mulch, and invasive weeds produce false positives.

**LeafVision** solves this by combining deep learning instance segmentation (**Mask R-CNN with a ResNet-50-FPN backbone**) with precision agricultural computer vision (**Excess Green Index + Topological Watershed**). It identifies every visible leaf individually, draws crisp boundary contours, and extracts quantitative canopy health data in real time.

---

## ✨ Key Capabilities

1. **Pixel-Level Leaf Instance Segmentation**  
   Assigns a unique, non-colliding vibrant color overlay to each detected leaf (e.g. Emerald, Cyan, Purple, Orange, Amber) preserving natural serrated leaf margins.

2. **Automated Leaf Counting & Centroid Badges**  
   Locates the topological center of each leaf and displays clear, numbered badges for rapid visual verification.

3. **Canopy Surface Area Quantification**  
   Measures total plant surface area (in pixels and % of field of view) as well as the relative area contribution of each individual leaf instance.

4. **Chlorosis & Necrosis Damage Heatmaps**  
   Scans foliage for necrotic spots, nutrient chlorosis, and insect lesions using dual-band HSV and ExG analysis. Generates an instant visual heatmap (healthy canopy in emerald, lesions in vivid crimson) and calculates the exact healthy vs. damaged surface percentage.

5. **Dual-Engine Architecture (Zero-Downtime Guarantee)**  
   * **GPU Deep Learning Engine:** Connects to the FastAPI backend running fine-tuned Mask R-CNN with GPU acceleration.
   * **In-Browser Client-Side Engine:** If the backend server is offline or unreachable, the web app seamlessly falls back to a high-precision client-side JavaScript engine running in the user's browser—no installation required.

---

## 📦 Model Checkpoint

The fine-tuned Mask R-CNN weights checkpoint (trained on agricultural leaf datasets) is hosted on GitHub Releases:

* **Download Checkpoint:** [`best_leaf_maskrcnn.pth` (168 MB)](https://github.com/HarshCodes410/Web-Forge-PS/releases/download/v1.0/best_leaf_maskrcnn.pth)  
* For local server execution, place `best_leaf_maskrcnn.pth` in the project root folder.

---

## 🚀 Getting Started

### Option 1: Live Cloud Web Application (Vercel)
You can test the mission control dashboard instantly in your browser:
* **Live App:** [https://web-forge-leafvision-beta.vercel.app/](https://web-forge-leafvision-beta.vercel.app/)  
* **Standalone UI Demo:** [https://web-forge-leafvision-beta.vercel.app/standalone.html](https://web-forge-leafvision-beta.vercel.app/standalone.html)

---

### Option 2: Running the Next.js Frontend Locally

```bash
# 1. Install Node dependencies
npm install

# 2. Start development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

To verify a production build:
```bash
npm run build
```

---

### Option 3: Running the Python AI Backend Server

```bash
# 1. Install Python requirements
pip install -r requirements.txt

# 2. Launch the backend server
python server.py
# (Or on Windows: run backend\start.bat)
```
*The server initializes on `http://127.0.0.1:8000` and automatically detects CUDA GPU availability.*

To run a quick terminal test against the live backend:
```bash
python quick_test.py
```

---

## 📂 Repository Structure

```text
Web-Forge-PS/
├── app/                      # Next.js App Router (Layout & Workstation page)
│   ├── globals.css           # Mission-control dark theme & tailwind setup
│   ├── layout.tsx            # Root layout with responsive typography
│   └── page.tsx              # Main application entry point
├── components/               # React & UI components
│   ├── leafvision/           # Mission Control dashboard modules
│   │   ├── app-shell.tsx     # App shell with responsive sidebar navigation
│   │   ├── hero.tsx          # Hero header section
│   │   ├── pipeline.tsx      # Computer vision pipeline visualizer
│   │   ├── spec-strip.tsx    # Technical benchmark specifications
│   │   └── workstation/      # Image upload dropzone, metrics, & viewer
│   └── ui/                   # Reusable UI primitives
├── backend/                  # Standalone backend package
│   ├── app.py                # FastAPI backend entrypoint
│   ├── Dockerfile            # Container deployment definition
│   └── start.bat             # 1-Click Windows launcher script
├── images/                   # Sample agricultural plant field images
├── lib/                      # Client utilities & algorithms
│   ├── api.ts                # API client with automatic fallback
│   ├── browser-engine.ts     # In-browser HTML5 canvas computer vision engine
│   ├── history.ts            # Local scan history persistence manager
│   └── utils.ts              # Styling & format utilities
├── public/                   # Static assets & sample images
│   ├── standalone.html       # Standalone single-file HTML dashboard
│   └── downloads/            # 1-Click backend starter bundle
├── server.py                 # Unified FastAPI backend server (Mask R-CNN)
├── quick_test.py             # CLI test validation script
├── vercel.json               # Vercel deployment configuration
├── next.config.mjs           # Next.js configuration (static export)
├── package.json              # Project scripts & dependencies
└── requirements.txt          # Python machine learning dependencies
```

---

## 📊 Benchmark Metrics

| Metric | Measured Value | Notes |
| :--- | :---: | :--- |
| **Mask mAP @ IoU 0.50** | **0.841** | Validated against test leaf masks |
| **BBox mAP @ IoU 0.50** | **0.876** | Fast R-CNN bounding frame localization |
| **GPU Latency (Inference)** | **~42 ms** | Tested on NVIDIA RTX GPU (CUDA 12.6) |
| **In-Browser Client Latency** | **~65 ms** | Sub-100ms instant responsiveness on standard laptops |
| **Supported File Formats** | **JPG, PNG, WebP** | Multi-channel RGB image processing |

---

## 👥 Team

* **Harsh Gugale** ([@HarshCodes410](https://github.com/HarshCodes410)) — Architecture, Model Integration & Full-Stack Development  
* **MANIT Bhopal** — Web Forge Hackathon 2026
