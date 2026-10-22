#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if [ -f ".venv/bin/python" ]; then
    echo "Using virtualenv at .venv (Python 3.11)"
    echo "Starting PhenoBench FastAPI server on http://localhost:8000..."
    exec .venv/bin/python app.py
fi

echo "Virtual environment not found. Initializing..."
if command -v uv >/dev/null 2>&1; then
    uv venv .venv --python 3.11
    uv pip install -r requirements.txt --python .venv/bin/python
elif [ -f "$HOME/.local/bin/uv" ]; then
    "$HOME/.local/bin/uv" venv .venv --python 3.11
    "$HOME/.local/bin/uv" pip install -r requirements.txt --python .venv/bin/python
fi

echo "Starting server on http://localhost:8000..."
exec .venv/bin/python app.py
