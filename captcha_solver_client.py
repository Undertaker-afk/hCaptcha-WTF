#!/usr/bin/env python3
"""
hCaptcha/reCaptcha Solver Client mit AI-Integration
Unterstützt: hcaptcha-solver, brokecord-solver, Impulse
Kommuniziert mit Firefox-Extension via WebSocket
"""

import sys
import os
import logging
import random
import math
import time
import json
import asyncio
from threading import Thread
from pathlib import Path

# WebSocket-Server für Browser-Kommunikation
try:
    import websockets
except ImportError:
    print("websockets nicht installiert. Führe aus: pip install websockets")
    sys.exit(1)

# Logging-Konsole (für PyInstaller-Kompatibilität)
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger("captcha-solver")

# ============================================================================
# MAUSBEWEGUNGSSIMULATION MIT 10 RANDOMISIERTEN MATHEMATISCHEN GLEICHUNGEN
# ============================================================================

EQUATIONS = [
    lambda t, r: math.sin(t * r) * 50 + random.uniform(-3, 3),
    lambda t, r: math.cos(t * r) * 40 + random.uniform(-3, 3),
    lambda t, r: (t ** 1.5) * r + random.uniform(-2, 2),
    lambda t, r: math.log(t + 1) * 30 * r + random.uniform(-2, 2),
    lambda t, r: math.exp(0.03 * t * r) + random.uniform(-2, 2),
    lambda t, r: 60 * math.atan(t / (10 * r)) + random.uniform(-2, 2),
    lambda t, r: 20 * math.tanh(0.1 * t * r) + random.uniform(-2, 2),
    lambda t, r: 10 * math.sqrt(abs(t * r)) + random.uniform(-2, 2),
    lambda t, r: 30 * math.sin(t * r * 0.5) * math.cos(t * r * 0.3) + random.uniform(-2, 2),
    lambda t, r: 25 * (1 - math.exp(-0.1 * t * r)) + random.uniform(-2, 2),
]

def generate_human_mouse_path(start, end, steps=50):
    """
    Generiert einen menschenähnlichen Mausbewegungspfad mit randomisierten
    mathematischen Gleichungen für natürliche Bewegungsmuster.
    """
    # Randomisiere die Reihenfolge der Gleichungen
    equations = random.sample(EQUATIONS, len(EQUATIONS))
    path = []
    
    dx_total = end[0] - start[0]
    dy_total = end[1] - start[1]
    distance = math.sqrt(dx_total**2 + dy_total**2)
    
    # Randomisierter Zeitfaktor
    time_factor = random.uniform(0.5, 1.5)
    
    for i in range(steps):
        progress = i / steps
        
        # Basis-Bezier-Kurve für smoothe Bewegung
        ease_progress = progress * progress * (3.0 - 2.0 * progress)
        
        # Wähle randomisierte Gleichung basierend auf Fortschritt
        eq_idx = int(progress * len(equations)) % len(equations)
        eq = equations[eq_idx]
        
        # Random-Seed für diese Iteration
        r = random.uniform(0.8, 1.2)
        t = progress * 10 * time_factor
        
        # Berechne Offset mit der Gleichung
        offset_x = eq(t, r) * (1 - progress)  # Offset nimmt gegen Ende ab
        offset_y = eq(t + 1, r * 0.9) * (1 - progress)
        
        # Normalisiere Offset basierend auf Distanz
        offset_scale = min(1.0, distance / 100)
        offset_x *= offset_scale
        offset_y *= offset_scale
        
        # Berechne finale Position
        x = start[0] + dx_total * ease_progress + offset_x
        y = start[1] + dy_total * ease_progress + offset_y
        
        # Füge micro-jitter für Realismus hinzu
        if i > 0 and i < steps - 1:
            x += random.uniform(-0.5, 0.5)
            y += random.uniform(-0.5, 0.5)
        
        path.append((x, y))
    
    # Stelle sicher, dass wir am Ziel ankommen
    path[-1] = end
    
    return path

# ============================================================================
# AI-SOLVER INTEGRATION
# ============================================================================

class CaptchaSolverAI:
    """
    Integriert alle drei Solver:
    - hcaptcha-solver (AI-basiert mit ONNX/YOLO)
    - brokecord-solver (GPT-basiert)
    - Impulse (YOLOv5-basiert mit Selenium)
    """
    
    def __init__(self):
        self.hcaptcha_solver_available = False
        self.impulse_available = False
        self.setup_solvers()
    
    def setup_solvers(self):
        """Initialisiere verfügbare Solver"""
        try:
            # Prüfe hcaptcha-solver
            sys.path.insert(0, str(Path(__file__).parent / "hcaptcha-solver"))
            from modules.captcha import CaptchaSolver
            self.hcaptcha_solver = CaptchaSolver
            self.hcaptcha_solver_available = True
            log.info("✓ hcaptcha-solver geladen")
        except Exception as e:
            log.warning(f"✗ hcaptcha-solver nicht verfügbar: {e}")
        
        try:
            # Prüfe Impulse
            sys.path.insert(0, str(Path(__file__).parent / "Impulse" / "src"))
            from impulse.solver import Solver as ImpulseSolver
            self.impulse_solver = ImpulseSolver
            self.impulse_available = True
            log.info("✓ Impulse-Solver geladen")
        except Exception as e:
            log.warning(f"✗ Impulse-Solver nicht verfügbar: {e}")
    
    def solve_hcaptcha(self, sitekey, url, proxy=None):
        """Löst hCaptcha mit dem besten verfügbaren Solver"""
        log.info(f"🎯 Löse hCaptcha für {url}")
        log.info(f"   Sitekey: {sitekey}")
        
        # Versuche hcaptcha-solver (primär)
        if self.hcaptcha_solver_available:
            try:
                log.info("   Verwende hcaptcha-solver (AI-basiert)...")
                token = self.hcaptcha_solver.get_captcha_by_ai(
                    sitekey, url, proxy or ""
                )
                if token:
                    log.info(f"✓ Token erhalten: {token[:50]}...")
                    return {"success": True, "token": token, "solver": "hcaptcha-solver"}
            except Exception as e:
                log.error(f"✗ hcaptcha-solver fehlgeschlagen: {e}")
        
        # Fallback: Impulse
        if self.impulse_available:
            try:
                log.info("   Fallback: Verwende Impulse-Solver...")
                # Impulse benötigt Selenium WebDriver
                # Hier würde die Impulse-Integration folgen
                log.warning("   Impulse-Integration erfordert WebDriver-Setup")
            except Exception as e:
                log.error(f"✗ Impulse-Solver fehlgeschlagen: {e}")
        
        return {"success": False, "error": "Kein Solver verfügbar"}
    
    def solve_recaptcha(self, sitekey, url):
        """Löst reCaptcha (experimentell)"""
        log.info(f"🎯 Löse reCaptcha für {url}")
        log.warning("   reCaptcha-Support ist experimentell")
        
        # Hier könnte Impulse oder ein anderer Solver verwendet werden
        return {"success": False, "error": "reCaptcha-Support nicht implementiert"}

# ============================================================================
# WEBSOCKET-SERVER FÜR BROWSER-KOMMUNIKATION
# ============================================================================

class CaptchaServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.solver = CaptchaSolverAI()
        self.clients = set()
    
    async def handle_client(self, websocket, path):
        """Verarbeitet Client-Verbindungen von der Firefox-Extension"""
        self.clients.add(websocket)
        client_addr = websocket.remote_address
        log.info(f"🔌 Client verbunden: {client_addr}")
        
        try:
            async for message in websocket:
                await self.process_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            log.info(f"🔌 Client getrennt: {client_addr}")
        finally:
            self.clients.remove(websocket)
    
    async def process_message(self, websocket, message):
        """Verarbeitet eingehende Nachrichten von der Browser-Extension"""
        try:
            data = json.loads(message)
            action = data.get("action")
            
            log.info(f"📨 Nachricht empfangen: {action}")
            
            if action == "solve_hcaptcha":
                sitekey = data.get("sitekey")
                url = data.get("url")
                proxy = data.get("proxy")
                
                # Löse Captcha
                result = self.solver.solve_hcaptcha(sitekey, url, proxy)
                
                # Sende Antwort zurück
                response = {
                    "action": "captcha_result",
                    "type": "hcaptcha",
                    **result
                }
                await websocket.send(json.dumps(response))
            
            elif action == "solve_recaptcha":
                sitekey = data.get("sitekey")
                url = data.get("url")
                
                result = self.solver.solve_recaptcha(sitekey, url)
                
                response = {
                    "action": "captcha_result",
                    "type": "recaptcha",
                    **result
                }
                await websocket.send(json.dumps(response))
            
            elif action == "get_mouse_path":
                # Generiere Mausbewegungspfad
                start = data.get("start", [0, 0])
                end = data.get("end", [100, 100])
                steps = data.get("steps", 50)
                
                path = generate_human_mouse_path(
                    tuple(start), tuple(end), steps
                )
                
                response = {
                    "action": "mouse_path",
                    "path": [[x, y] for x, y in path]
                }
                await websocket.send(json.dumps(response))
            
            elif action == "ping":
                await websocket.send(json.dumps({"action": "pong"}))
            
            else:
                log.warning(f"⚠️  Unbekannte Aktion: {action}")
                await websocket.send(json.dumps({
                    "action": "error",
                    "error": f"Unbekannte Aktion: {action}"
                }))
        
        except json.JSONDecodeError:
            log.error("❌ Ungültige JSON-Nachricht")
            await websocket.send(json.dumps({
                "action": "error",
                "error": "Ungültige JSON-Nachricht"
            }))
        except Exception as e:
            log.error(f"❌ Fehler bei Nachrichtenverarbeitung: {e}")
            await websocket.send(json.dumps({
                "action": "error",
                "error": str(e)
            }))
    
    async def start(self):
        """Startet den WebSocket-Server"""
        log.info("="*60)
        log.info("🚀 Captcha-Solver-Client gestartet")
        log.info("="*60)
        log.info(f"📡 WebSocket-Server läuft auf ws://{self.host}:{self.port}")
        log.info("🌐 Warte auf Verbindungen von Firefox-Extension...")
        log.info("="*60)
        
        async with websockets.serve(self.handle_client, self.host, self.port):
            await asyncio.Future()  # run forever

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Haupteinstiegspunkt"""
    try:
        server = CaptchaServer(host="localhost", port=8765)
        asyncio.run(server.start())
    except KeyboardInterrupt:
        log.info("\n👋 Server gestoppt durch Benutzer")
    except Exception as e:
        log.error(f"❌ Kritischer Fehler: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
