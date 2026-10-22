# PhenoBench ResNet-50 Classifier Backend

FastAPI deep learning backend serving a ResNet-50 convolutional neural network trained on the **PhenoBench** agricultural dataset for automated **Crop vs Weed** identification.

---

## 📁 Files

- `app.py`: FastAPI server with image preprocessing, model architecture, and prediction pipeline.
- `resnet50_phenobench.pth`: PyTorch trained model weights (ResNet-50).
- `requirements.txt`: Python package dependencies (`fastapi`, `uvicorn`, `torch`, `torchvision`, `Pillow`, `python-multipart`).
- `Dockerfile`: Container definition for local Docker or cloud deployment.

---

## 🚀 Local Setup & Running

### Requirements
- Python 3.10, 3.11, or 3.12 (recommended for PyTorch wheels)

### 1. Create and Activate Virtual Environment
```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python app.py
```
Or via uvicorn directly:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

---

## 📡 API Endpoints

### 1. Health Check
`GET /health`
```json
{
  "status": "online",
  "model": "ResNet-50 PhenoBench",
  "version": "1.0.0"
}
```

### 2. Prediction
`POST /predict`
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (JPG, PNG, or WebP image)

Example response:
```json
{
  "status": "success",
  "class_id": 0,
  "prediction": "Crop",
  "confidence": 0.9842,
  "probabilities": {
    "Crop": 0.9842,
    "Weed": 0.0158
  },
  "inference_ms": 142.5
}
```

---

## ☁️ Free Cloud Deployment Options

### Option A: Hugging Face Spaces (Recommended Free CPU/GPU)
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Choose **Docker** SDK (Blank).
3. Push the contents of the `backend/` folder (`app.py`, `resnet50_phenobench.pth`, `requirements.txt`, `Dockerfile`).
4. Set port in Dockerfile / Space to `7860` or default `8000`.
5. Once running, copy your Space URL (e.g. `https://username-space.hf.space`) and set `NEXT_PUBLIC_API_URL` in your frontend `.env.local` or Vercel dashboard.

### Option B: Render.com
1. Create a new **Web Service** on Render.
2. Connect your Git repository and set the root directory to `backend`.
3. Select **Docker** or **Python** environment.
4. Set start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`.
5. Copy your Render service URL to `NEXT_PUBLIC_API_URL`.
