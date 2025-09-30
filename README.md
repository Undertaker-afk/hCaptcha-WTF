# 🔓 hCaptcha/reCaptcha Auto-Solver

Ein KI-gestützter Captcha-Solver, der korrupte oder schwer lesbare hCaptchas und reCaptchas automatisch löst. Das System besteht aus einem Python-Client mit AI-Integration und einer Firefox-Extension.

## ✨ Features

- 🤖 **AI-gestützte Captcha-Lösung** mit 3 integrierten Solvern:
  - `hcaptcha-solver` - AI-basiert mit ONNX/YOLO-Modellen
  - `brokecord-solver` - GPT-basiert für komplexe Aufgaben
  - `Impulse` - YOLOv5-basiert mit Selenium
  
- 🎯 **Realistische Mausbewegungen** mit 10 randomisierten mathematischen Gleichungen für menschenähnliche Bewegungsmuster

- 🌐 **Firefox-Extension** für nahtlose Browser-Integration

- 🔌 **WebSocket-Server** für Echtzeit-Kommunikation zwischen Browser und Python-Client

- 📊 **Log-Konsole** mit detaillierten Status-Updates

- 💻 **Kompilierbar zu .exe** mit PyInstaller für einfache Verteilung

## 📋 Voraussetzungen

- Python 3.8 oder höher
- Firefox Browser
- Windows/Linux/Mac

## 🚀 Installation

### 1. Repository klonen

```bash
git clone https://github.com/Undertaker-afk/hCaptcha-WTF.git
cd hCaptcha-WTF
```

### 2. Python-Dependencies installieren

```bash
# Basis-Requirements
pip install -r requirements.txt

# Optional: Vollständige Requirements mit allen Solver-Dependencies
pip install -r requirements_full.txt
```

### 3. Solver-Dependencies installieren (optional)

Für die volle Funktionalität der einzelnen Solver:

```bash
# hcaptcha-solver
cd hcaptcha-solver
pip install -r requirements.txt
cd ..

# Impulse
cd Impulse
pip install -r requirements.txt
cd ..
```

## 🎮 Nutzung

### Python-Client starten

**Option 1: Direkt mit Python**

```bash
python captcha_solver_client.py
```

**Option 2: Als kompilierte .exe (Windows)**

```bash
# Build
build.bat

# Dann starte
dist\CaptchaSolverClient.exe
```

**Option 3: Als kompilierte Binary (Linux/Mac)**

```bash
# Build
./build.sh

# Dann starte
./dist/CaptchaSolverClient
```

Du solltest folgende Ausgabe sehen:

```
============================================================
🚀 Captcha-Solver-Client gestartet
============================================================
📡 WebSocket-Server läuft auf ws://localhost:8765
🌐 Warte auf Verbindungen von Firefox-Extension...
============================================================
```

### Firefox-Extension installieren

1. Öffne Firefox
2. Gehe zu `about:debugging#/runtime/this-firefox`
3. Klicke auf **"Temporäres Add-on laden..."**
4. Navigiere zu `firefox-extension/manifest.json`
5. Die Extension sollte jetzt installiert sein ✓

### Captchas lösen

**Automatisch:**
- Die Extension erkennt automatisch hCaptchas und reCaptchas auf Webseiten
- Sobald ein Captcha erkannt wird, beginnt die Lösung automatisch

**Manuell:**
1. Klicke auf das Extension-Icon in der Firefox-Toolbar
2. Klicke auf **"🎯 Captcha Jetzt Lösen"**
3. Das Captcha wird gelöst und der Token automatisch eingefügt

## 🔧 Konfiguration

### Python-Client

Die Konfiguration erfolgt in `captcha_solver_client.py`:

```python
# WebSocket-Server-Einstellungen
server = CaptchaServer(host="localhost", port=8765)

# Mausbewegung-Parameter
path = generate_human_mouse_path(
    start=(0, 0),
    end=(100, 100),
    steps=50  # Anzahl der Bewegungsschritte
)
```

### Firefox-Extension

Die Konfiguration erfolgt in `firefox-extension/background.js`:

```javascript
// WebSocket-URL anpassen
const WS_URL = "ws://localhost:8765";

// Auto-Solve aktivieren/deaktivieren
let isEnabled = true;
```

## 🎨 Mausbewegungssimulation

Das System verwendet 10 verschiedene mathematische Gleichungen, die bei jeder Bewegung randomisiert werden:

1. Sinus-Funktion mit Randomisierung
2. Kosinus-Funktion mit Randomisierung
3. Exponential-Funktion
4. Logarithmus-Funktion
5. Exponential-Wachstum
6. Arcus-Tangens
7. Tangens-Hyperbolicus
8. Wurzel-Funktion
9. Sinus-Kosinus-Kombination
10. Exponential-Abfall

Diese werden bei jeder Mausbewegung in zufälliger Reihenfolge angewendet, um menschenähnliche, nicht-lineare Bewegungsmuster zu erzeugen.

## 📁 Projektstruktur

```
hCaptcha-WTF/
├── captcha_solver_client.py    # Haupt-Python-Client
├── requirements.txt             # Basis-Requirements
├── requirements_full.txt        # Vollständige Requirements
├── build_exe.py                 # PyInstaller-Build-Skript
├── build.bat                    # Windows-Build-Skript
├── build.sh                     # Linux/Mac-Build-Skript
│
├── firefox-extension/           # Firefox-Extension
│   ├── manifest.json           # Extension-Manifest
│   ├── background.js           # Background-Script
│   ├── content.js              # Content-Script
│   ├── popup.html              # Popup-UI
│   ├── popup.js                # Popup-Logic
│   └── icon*.png               # Icons
│
├── hcaptcha-solver/            # AI-basierter hCaptcha-Solver
├── brokecord-solver/           # GPT-basierter Solver
└── Impulse/                    # YOLOv5-basierter Solver
```

## 🐛 Troubleshooting

### Python-Client startet nicht

```bash
# Stelle sicher, dass alle Dependencies installiert sind
pip install -r requirements.txt

# Prüfe Python-Version
python --version  # Sollte >= 3.8 sein
```

### Firefox-Extension verbindet nicht

1. Stelle sicher, dass der Python-Client läuft
2. Prüfe, ob der WebSocket-Server auf Port 8765 läuft
3. Öffne die Browser-Konsole (F12) und prüfe auf Fehler
4. Klicke in der Extension auf "🔄 Neu Verbinden"

### Captcha wird nicht gelöst

1. Prüfe die Python-Client-Konsole auf Fehlermeldungen
2. Stelle sicher, dass die Solver-Dependencies installiert sind
3. Prüfe, ob der Sitekey korrekt erkannt wurde (siehe Browser-Konsole)

### .exe kompiliert nicht

```bash
# Installiere PyInstaller
pip install pyinstaller

# Stelle sicher, dass alle Dependencies installiert sind
pip install -r requirements_full.txt

# Führe Build-Skript aus
python build_exe.py
```

## ⚠️ Hinweise

- **Nur für legitime Zwecke**: Dieses Tool wurde entwickelt, um korrupte oder nicht funktionierende Captchas zu umgehen. Nutze es verantwortungsvoll.
- **Rate-Limiting**: Manche Seiten haben Rate-Limits. Nutze das Tool nicht exzessiv.
- **Updates**: Die Captcha-Systeme werden ständig aktualisiert. Halte die Solver auf dem neuesten Stand.

## 📝 Lizenz

Dieses Projekt kombiniert mehrere Open-Source-Projekte:
- [hcaptcha-solver](https://github.com/BlankRoad1/hcaptcha-solver)
- [brokecord-solver](https://github.com/gongchandang49/brokecord-solver)
- [Impulse](https://github.com/MainSilent/Impulse)

Siehe die jeweiligen Repositories für Lizenzinformationen.

## 🤝 Contributing

Contributions sind willkommen! Bitte erstelle einen Pull Request oder Issue.

## 📧 Support

Bei Fragen oder Problemen öffne bitte ein Issue auf GitHub.

---

Made with ❤️ for bypassing broken captchas