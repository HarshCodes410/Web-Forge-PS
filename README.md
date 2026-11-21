# 🍃 Web-Forge PS 07 // AI Leaf Instance Segmentation & Phenotyping

[![WEB FORGE 2026](https://img.shields.io/badge/WEB%20FORGE%202026-PS%2007-orange.svg)](https://github.com/HarshCodes410/Web-Forge-PS)
[![Model](https://img.shields.io/badge/Model-Mask%20R--CNN%20(ResNet--50--FPN)-purple.svg)](https://arxiv.org/abs/1703.06870)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20PyTorch-green.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%20%2B%20Tailwind%20CSS-blue.svg)](https://nextjs.org/)

Solution for **Web Forge 2026 (Problem Statement 07: Leaf Instance Segmentation & Plant Phenotyping)**.

---

## 📌 Problem Overview

Accurate identification and segmentation of individual leaves is vital for **high-throughput plant phenotyping** and **precision agriculture** (e.g., leaf counting, growth-rate tracking, canopy surface area estimation, and chlorosis/lesion detection).

In real agricultural field images, plants suffer from:
* **Overlapping leaves and heavy occlusions**
* **Variable natural lighting and cast shadows**
* **Complex soil, mulch, and weed backgrounds**

**Pheno-Forge** delivers an end-to-end multi-leaf instance segmentation and phenotyping system. Using supervised deep learning (Mask R-CNN ResNet-50-FPN) alongside precision computer vision (Excess Green Index + Topological Watershed), it:
1. Detects and segments every individual visible leaf with distinct pixel masks.
2. Draws crisp bounding frames and numbered centroid markers.
3. Quantifies total canopy surface area and per-leaf area.
4. Classifies Crop vs. Weed.
5. Measures chlorosis/necrosis damage severity with automated damage heatmaps.

---

## 📦 Model Checkpoint

Download the fine-tuned Mask R-CNN weights checkpoint:
* **Direct Download:** [`best_leaf_maskrcnn.pth` (168 MB)](https://github.com/HarshCodes410/Web-Forge-PS/releases/download/v1.0/best_leaf_maskrcnn.pth) from [Release v1.0](https://github.com/HarshCodes410/Web-Forge-PS/releases/tag/v1.0)
* Place `best_leaf_maskrcnn.pth` in the project root directory.

---

## 🚀 Quick Start

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the AI Backend Server
```bash
python server.py
```
*The server starts on `http://127.0.0.1:8000` with CUDA GPU acceleration enabled if available.*

### 3. Run Quick Test
In a separate terminal:
```bash
python quick_test.py
```

### 4. Launch the Web Interface

You have two interactive interfaces available:

#### Option A: Next.js Mission Control Workstation (Recommended)
```bash
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

#### Option B: Standalone HTML Dashboard
Simply open **`index.html`** in your browser (Google Chrome, Edge, Firefox).

---

## 📂 Repository Structure

```text
Web-Forge/
├── app/                      # Next.js App Router (Layout & Workstation page)
├── backend/                  # FastAPI backend module & start scripts
│   ├── app.py                # Backend application entrypoint
│   └── start.bat             # 1-Click Windows backend launcher
├── components/               # React & UI components (LeafVision workstation)
├── images/                   # Sample agricultural plant test images
├── lib/                      # API client, browser CV fallback, history manager
├── index.html                # Standalone Mission Control Dashboard UI
├── server.py                 # Unified FastAPI backend (PyTorch Mask R-CNN)
├── quick_test.py             # Automated CLI API validation test script
├── train.py                  # Mask R-CNN PyTorch training script
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies & scripts
└── README.md                 # Project documentation
```

---

## 🌟 Key Capabilities

* **Dual Engine Architecture:** Runs fine-tuned PyTorch Mask R-CNN on GPU with instant client-side browser computer vision fallback if offline.
* **Pixel-Level Instance Masks:** Assigns vibrant, high-contrast colors to each separated leaf.
* **Canopy Health Telemetry:** Automatically isolates chlorotic and necrotic leaf lesions, calculating damage percentage and healthy canopy area.
* **Batch Processing:** Handles multi-image batch analysis simultaneously with latency profiling.
