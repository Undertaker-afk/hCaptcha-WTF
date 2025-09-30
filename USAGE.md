# 📖 Erweiterte Nutzungsanleitung

## 🎯 Schnellstart (5 Minuten)

### 1. Vorbereitung

```bash
# Repository klonen
git clone https://github.com/Undertaker-afk/hCaptcha-WTF.git
cd hCaptcha-WTF

# Schnellstart-Skript ausführen
python start.py
# oder
./start.sh  # Linux/Mac
start.bat   # Windows
```

Das Skript installiert automatisch alle notwendigen Dependencies und startet den Client.

### 2. Firefox-Extension einrichten

1. **Firefox öffnen**
2. **about:debugging** in die Adressleiste eingeben
3. **"Dieser Firefox"** auswählen
4. **"Temporäres Add-on laden..."** klicken
5. Zur Datei `firefox-extension/manifest.json` navigieren
6. **Öffnen** klicken

✓ Die Extension ist jetzt aktiv!

### 3. Captcha lösen

Gehe zu einer Seite mit hCaptcha (z.B. Discord-Registrierung) - das Captcha wird automatisch gelöst!

---

## 🔧 Erweiterte Konfiguration

### WebSocket-Server-Port ändern

**Python-Client** (`captcha_solver_client.py`):

```python
# Zeile ~330
server = CaptchaServer(host="localhost", port=8765)
```

**Firefox-Extension** (`firefox-extension/background.js`):

```javascript
// Zeile 9
const WS_URL = "ws://localhost:8765";
```

### Proxy-Support

Füge Proxy-Unterstützung zum Python-Client hinzu:

```python
# In captcha_solver_client.py
proxy = "http://user:pass@proxy.example.com:8080"

result = self.solver.solve_hcaptcha(sitekey, url, proxy=proxy)
```

### Auto-Solve deaktivieren

**Option 1: In der Extension**
- Klicke auf das Extension-Icon
- Klicke auf "⏸️ Auto-Solve Pausieren"

**Option 2: Im Code** (`firefox-extension/content.js`):

```javascript
// Zeile 3
let isEnabled = false;  // Auto-Solve deaktiviert
```

---

## 🎨 Mausbewegungen anpassen

### Anzahl der Bewegungsschritte

Mehr Schritte = smoothere, aber langsamere Bewegung:

```python
# In captcha_solver_client.py
path = generate_human_mouse_path(
    start=(0, 0),
    end=(100, 100),
    steps=100  # Standard: 50
)
```

### Eigene Bewegungsgleichungen hinzufügen

```python
# In captcha_solver_client.py, Zeile ~40
EQUATIONS = [
    # ... bestehende Gleichungen ...
    
    # Füge eigene hinzu:
    lambda t, r: 15 * math.sin(t * r * 2) + random.uniform(-1, 1),
    lambda t, r: 20 * (t ** 0.5) * r + random.uniform(-2, 2),
]
```

---

## 🤖 Solver-Konfiguration

### Nur bestimmte Solver verwenden

Bearbeite `captcha_solver_client.py`:

```python
class CaptchaSolverAI:
    def __init__(self):
        self.hcaptcha_solver_available = True   # hcaptcha-solver
        self.impulse_available = False          # Impulse deaktivieren
        # ...
```

### Solver-Priorität ändern

In der `solve_hcaptcha`-Methode kannst du die Reihenfolge ändern:

```python
def solve_hcaptcha(self, sitekey, url, proxy=None):
    # Versuche zuerst Impulse statt hcaptcha-solver
    if self.impulse_available:
        # Impulse-Code hier
        pass
    
    if self.hcaptcha_solver_available:
        # hcaptcha-solver als Fallback
        pass
```

---

## 🐛 Debugging

### Verbose-Logging aktivieren

```python
# In captcha_solver_client.py, Zeile ~28
logging.basicConfig(
    level=logging.DEBUG,  # Statt INFO
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
```

### Browser-Konsole öffnen

1. **F12** drücken in Firefox
2. **Konsole**-Tab auswählen
3. Filtere nach `[Content]` oder `[Background]` für Extension-Logs

### WebSocket-Verbindung testen

```bash
# Python-Client starten
python captcha_solver_client.py

# In einem neuen Terminal:
python -c "
import asyncio
import websockets

async def test():
    async with websockets.connect('ws://localhost:8765') as ws:
        await ws.send('{\"action\": \"ping\"}')
        response = await ws.recv()
        print('Antwort:', response)

asyncio.run(test())
"
```

---

## 🚀 Performance-Optimierung

### Parallel-Processing für mehrere Captchas

```python
import concurrent.futures

def solve_multiple_captchas(captcha_list):
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(solver.solve_hcaptcha, c['sitekey'], c['url'])
            for c in captcha_list
        ]
        results = [f.result() for f in futures]
    return results
```

### Caching von gelösten Captchas

```python
# In captcha_solver_client.py
from functools import lru_cache

@lru_cache(maxsize=100)
def solve_hcaptcha_cached(sitekey, url):
    return self.solver.solve_hcaptcha(sitekey, url)
```

---

## 📊 Statistiken und Monitoring

### Erfolgsrate tracken

Bearbeite `firefox-extension/background.js`:

```javascript
let stats = {
    solved: 0,
    failed: 0,
    totalTime: 0
};

// Bei erfolgreicher Lösung:
stats.solved++;
console.log(`Erfolgsrate: ${(stats.solved / (stats.solved + stats.failed) * 100).toFixed(2)}%`);
```

### Lösezeit messen

```python
import time

def solve_hcaptcha(self, sitekey, url, proxy=None):
    start_time = time.time()
    result = # ... löse Captcha ...
    elapsed = time.time() - start_time
    log.info(f"⏱️  Gelöst in {elapsed:.2f}s")
    return result
```

---

## 🔐 Sicherheit & Best Practices

### Proxy-Rotation

```python
import random

proxies = [
    "http://proxy1.example.com:8080",
    "http://proxy2.example.com:8080",
    "http://proxy3.example.com:8080"
]

def get_random_proxy():
    return random.choice(proxies)

# Nutze bei jedem Request:
result = solver.solve_hcaptcha(sitekey, url, proxy=get_random_proxy())
```

### Rate-Limiting

```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_requests, time_window):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
    
    def wait_if_needed(self):
        now = time.time()
        # Entferne alte Requests
        while self.requests and self.requests[0] < now - self.time_window:
            self.requests.popleft()
        
        if len(self.requests) >= self.max_requests:
            sleep_time = self.requests[0] + self.time_window - now
            if sleep_time > 0:
                log.info(f"⏳ Rate-Limit erreicht, warte {sleep_time:.1f}s")
                time.sleep(sleep_time)
        
        self.requests.append(now)

# Verwende:
limiter = RateLimiter(max_requests=10, time_window=60)  # 10 Requests pro Minute

def solve_hcaptcha(self, sitekey, url, proxy=None):
    limiter.wait_if_needed()
    # ... löse Captcha ...
```

---

## 🌐 Remote-Setup (Server + Client)

### Server-Modus

Bearbeite `captcha_solver_client.py`:

```python
# Erlaube externe Verbindungen
server = CaptchaServer(host="0.0.0.0", port=8765)
```

### Client auf anderem PC

In `firefox-extension/background.js`:

```javascript
// Verbinde zu Remote-Server
const WS_URL = "ws://192.168.1.100:8765";  // IP des Servers
```

**⚠️ Sicherheitswarnung:** Nutze SSL/TLS für Produktionsumgebungen!

---

## 📦 .exe-Build-Optionen

### Kleinere .exe-Datei

```python
# In build_exe.py
PyInstaller.__main__.run([
    # ...
    '--onefile',
    '--strip',          # Entferne Debug-Symbole
    '--upx-dir=./upx',  # UPX-Kompression (falls installiert)
])
```

### Ohne Konsole (Hidden)

```python
# In build_exe.py
'--noconsole',  # Statt --console
```

### Icon hinzufügen

```bash
# Erstelle icon.ico
# Dann in build_exe.py:
'--icon=icon.ico',
```

---

## 🧪 Testing

### Unit-Tests

```python
# test_solver.py
import unittest
from captcha_solver_client import generate_human_mouse_path

class TestMouseMovement(unittest.TestCase):
    def test_path_length(self):
        path = generate_human_mouse_path((0, 0), (100, 100), steps=50)
        self.assertEqual(len(path), 50)
    
    def test_start_end(self):
        path = generate_human_mouse_path((0, 0), (100, 100), steps=50)
        self.assertEqual(path[-1], (100, 100))

if __name__ == '__main__':
    unittest.main()
```

### Integration-Test

```python
# test_integration.py
import asyncio
from captcha_solver_client import CaptchaServer

async def test_server():
    server = CaptchaServer()
    # Teste WebSocket-Verbindung
    # ...

if __name__ == '__main__':
    asyncio.run(test_server())
```

---

## 🆘 Häufige Probleme & Lösungen

### "Module not found" Fehler

```bash
# Installiere alle Dependencies neu
pip install -r requirements.txt --force-reinstall
```

### WebSocket-Verbindung schlägt fehl

```bash
# Prüfe ob Port 8765 frei ist
netstat -an | grep 8765

# Falls belegt, ändere Port in beiden Dateien
```

### Captcha wird nicht erkannt

1. Öffne Browser-Konsole (F12)
2. Prüfe ob Content-Script geladen wurde
3. Suche nach `[Content] Captcha Auto-Solver geladen`

### Token wird nicht eingefügt

1. Prüfe ob Captcha-Response-Textareas vorhanden sind:
   ```javascript
   document.querySelectorAll('textarea[name*="captcha-response"]')
   ```
2. Füge manuelle Injection hinzu in `content.js`

---

## 💡 Tipps & Tricks

### Hotkey für manuelles Lösen

Füge in `firefox-extension/content.js` hinzu:

```javascript
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        console.log("[Content] Hotkey: Löse Captcha");
        solveHCaptcha();
    }
});
```

### Auto-Submit nach Lösung

```javascript
function injectToken(token, type) {
    // ... Token einfügen ...
    
    // Auto-Submit
    const form = document.querySelector('form');
    if (form) {
        setTimeout(() => form.submit(), 1000);
    }
}
```

### Dark Mode für Extension-Popup

In `firefox-extension/popup.html`:

```css
@media (prefers-color-scheme: dark) {
    body {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
}
```

---

## 📚 Weiterführende Ressourcen

- [hCaptcha API Dokumentation](https://docs.hcaptcha.com/)
- [reCaptcha API Dokumentation](https://developers.google.com/recaptcha)
- [Firefox Extension Entwicklung](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [WebSocket Protokoll](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

Made with ❤️ for bypassing broken captchas
