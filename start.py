#!/usr/bin/env python3
"""
Schnellstart-Skript für Captcha-Solver
Installiert alle notwendigen Dependencies und startet den Client
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, desc):
    """Führe Kommando aus und zeige Status"""
    print(f"\n{'='*60}")
    print(f"📦 {desc}")
    print(f"{'='*60}")
    try:
        subprocess.check_call(cmd, shell=True)
        print(f"✓ {desc} erfolgreich")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Fehler bei: {desc}")
        print(f"   Fehlercode: {e.returncode}")
        return False

def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║       🔓 hCaptcha/reCaptcha Auto-Solver Setup 🔓         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    ROOT = Path(__file__).parent
    
    # Prüfe Python-Version
    version = sys.version_info
    print(f"Python-Version: {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 oder höher erforderlich!")
        sys.exit(1)
    
    # Installiere Basis-Requirements
    if not run_command(
        f"{sys.executable} -m pip install -r requirements.txt",
        "Installiere Basis-Requirements"
    ):
        print("\n⚠️  Fehler bei Installation. Versuche trotzdem zu starten...")
    
    # Optionale Solver-Dependencies
    print("\n" + "="*60)
    print("📦 Optionale Solver-Dependencies")
    print("="*60)
    print("Möchtest du die vollständigen Solver-Dependencies installieren?")
    print("(benötigt für volle AI-Funktionalität, kann einige Zeit dauern)")
    choice = input("\n[j/N]: ").lower().strip()
    
    if choice in ['j', 'ja', 'y', 'yes']:
        run_command(
            f"cd {ROOT}/hcaptcha-solver && {sys.executable} -m pip install -r requirements.txt",
            "Installiere hcaptcha-solver Dependencies"
        )
        run_command(
            f"cd {ROOT}/Impulse && {sys.executable} -m pip install -r requirements.txt",
            "Installiere Impulse Dependencies"
        )
    
    # Starte Client
    print("\n" + "="*60)
    print("🚀 Starte Captcha-Solver-Client")
    print("="*60)
    print("\nDrücke Strg+C zum Beenden\n")
    
    try:
        subprocess.run([sys.executable, str(ROOT / "captcha_solver_client.py")])
    except KeyboardInterrupt:
        print("\n\n👋 Client gestoppt")

if __name__ == "__main__":
    main()
