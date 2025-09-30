#!/bin/bash
# Build-Skript für Linux/Mac
# Kompiliert den Captcha-Solver-Client zu einer ausführbaren Datei

echo "================================================"
echo " Captcha-Solver-Client Build-Skript"
echo "================================================"
echo ""

echo "[1/3] Installiere PyInstaller..."
python3 -m pip install pyinstaller --quiet
echo ""

echo "[2/3] Starte Build-Prozess..."
python3 build_exe.py
echo ""

echo "[3/3] Fertig!"
echo ""
echo "Die ausführbare Datei befindet sich in: dist/CaptchaSolverClient"
echo ""
