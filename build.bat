@echo off
REM Build-Skript für Windows
REM Kompiliert den Captcha-Solver-Client zu einer .exe-Datei

echo ================================================
echo  Captcha-Solver-Client Build-Skript
echo ================================================
echo.

echo [1/3] Installiere PyInstaller...
python -m pip install pyinstaller --quiet
echo.

echo [2/3] Starte Build-Prozess...
python build_exe.py
echo.

echo [3/3] Fertig!
echo.
echo Die .exe-Datei befindet sich in: dist\CaptchaSolverClient.exe
echo.
pause
