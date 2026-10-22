#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================"
echo "      LEAFVISION PLANT PHENOTYPING AI BACKEND           "
echo "========================================================"

if [ -f ".venv/bin/python" ]; then
    echo "Using existing virtualenv at .venv..."
    exec .venv/bin/python app.py
fi

echo "Virtual environment not found. Initializing..."
if command -v uv >/dev/null 2>&1; then
    uv venv .venv --python 3.11 || uv venv .venv
    uv pip install -r requirements.txt --python .venv/bin/python
elif [ -f "$HOME/.local/bin/uv" ]; then
    "$HOME/.local/bin/uv" venv .venv --python 3.11 || "$HOME/.local/bin/uv" venv .venv
    "$HOME/.local/bin/uv" pip install -r requirements.txt --python .venv/bin/python
elif command -v python3 >/dev/null 2>&1; then
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "Python 3 is required but not found in PATH."
    exit 1
fi

echo "Starting server on http://localhost:8000..."
exec .venv/bin/python app.py
