#!/usr/bin/env python3
"""
PyInstaller Build-Skript für Captcha-Solver-Client
Kompiliert den Python-Client zu einer ausführbaren .exe-Datei
"""

import PyInstaller.__main__
import os
import sys
from pathlib import Path

# Projekt-Root
ROOT = Path(__file__).parent

# PyInstaller-Konfiguration
PyInstaller.__main__.run([
    str(ROOT / 'captcha_solver_client.py'),
    
    # Output-Einstellungen
    '--name=CaptchaSolverClient',
    '--onefile',  # Einzelne .exe-Datei
    '--console',  # Zeige Konsole beim Start
    
    # Icon (optional)
    # '--icon=icon.ico',
    
    # Versteckte Imports (für dynamische Imports)
    '--hidden-import=websockets',
    '--hidden-import=httpx',
    '--hidden-import=aiohttp',
    '--hidden-import=yaml',
    
    # Zusätzliche Dateien/Ordner einbinden
    f'--add-data={ROOT / "hcaptcha-solver"}{os.pathsep}hcaptcha-solver',
    f'--add-data={ROOT / "Impulse" / "src"}{os.pathsep}Impulse/src',
    
    # Output-Verzeichnis
    f'--distpath={ROOT / "dist"}',
    f'--workpath={ROOT / "build"}',
    f'--specpath={ROOT}',
    
    # Optimierungen
    '--clean',
    '--noconfirm',
    
    # Keine UPX-Kompression (für bessere Kompatibilität)
    '--noupx',
])

print("\n" + "="*60)
print("✓ Build abgeschlossen!")
print("="*60)
print(f"Die .exe-Datei befindet sich in: {ROOT / 'dist' / 'CaptchaSolverClient.exe'}")
print("\nStarte die .exe-Datei, um den Captcha-Solver-Client zu starten.")
print("Die Konsole zeigt alle Logs an.")
print("="*60)
