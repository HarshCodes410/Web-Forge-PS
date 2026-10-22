FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application and model weights
COPY app.py .
COPY resnet50_phenobench.pth .

# Port configuration (supports Hugging Face Spaces, Render, or Local)
ENV PORT=8000
EXPOSE 8000

CMD ["python", "app.py"]
