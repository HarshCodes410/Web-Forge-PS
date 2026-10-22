@echo off
title LeafVision AI Backend Launcher
echo ========================================================
echo       LEAFVISION PLANT PHENOTYPING BACKEND
echo ========================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.10 or 3.11 from https://www.python.org/
    pause
    exit /b 1
)

if not exist ".venv" (
    echo [1/3] Creating Python virtual environment...
    python -m venv .venv
)

echo [2/3] Activating virtual environment and installing dependencies...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [3/3] Starting LeafVision AI Server on http://localhost:8000...
echo Open or refresh your LeafVision website - it will automatically connect!
echo ========================================================
python app.py
pause
