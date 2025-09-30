/**
 * Popup-Script für Captcha Auto-Solver
 */

let isEnabled = true;
let stats = {
    solved: 0,
    failed: 0
};

// Lade gespeicherte Stats
browser.storage.local.get(['stats', 'isEnabled']).then(result => {
    if (result.stats) {
        stats = result.stats;
        updateStats();
    }
    if (result.isEnabled !== undefined) {
        isEnabled = result.isEnabled;
        updateToggleButton();
    }
});

/**
 * Prüfe Verbindungsstatus
 */
function checkConnection() {
    browser.runtime.sendMessage({ action: "is_connected" })
        .then(response => {
            const statusDot = document.getElementById('statusDot');
            const statusText = document.getElementById('statusText');
            
            if (response.connected) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Python-Client: Verbunden ✓';
            } else {
                statusDot.className = 'status-dot disconnected';
                statusText.textContent = 'Python-Client: Getrennt ✗';
            }
        })
        .catch(() => {
            const statusDot = document.getElementById('statusDot');
            const statusText = document.getElementById('statusText');
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Python-Client: Getrennt ✗';
        });
}

/**
 * Aktualisiere Stats-Anzeige
 */
function updateStats() {
    document.getElementById('solvedCount').textContent = stats.solved;
    
    const total = stats.solved + stats.failed;
    const rate = total > 0 ? Math.round((stats.solved / total) * 100) : 0;
    document.getElementById('successRate').textContent = rate + '%';
}

/**
 * Aktualisiere Toggle-Button
 */
function updateToggleButton() {
    const btn = document.getElementById('toggleBtn');
    if (isEnabled) {
        btn.textContent = '⏸️ Auto-Solve Pausieren';
    } else {
        btn.textContent = '▶️ Auto-Solve Aktivieren';
    }
}

/**
 * Event-Listener
 */
document.getElementById('solveBtn').addEventListener('click', () => {
    // Sende Nachricht an aktiven Tab
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {
            action: "solve_now"
        });
    });
    
    // Zeige Feedback
    const btn = document.getElementById('solveBtn');
    btn.textContent = '⏳ Löse...';
    setTimeout(() => {
        btn.textContent = '🎯 Captcha Jetzt Lösen';
    }, 2000);
});

document.getElementById('toggleBtn').addEventListener('click', () => {
    isEnabled = !isEnabled;
    browser.storage.local.set({ isEnabled: isEnabled });
    updateToggleButton();
    
    // Benachrichtige Content-Scripts
    browser.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
            browser.tabs.sendMessage(tab.id, {
                action: "toggle_enabled",
                enabled: isEnabled
            }).catch(() => {});
        });
    });
});

document.getElementById('reconnectBtn').addEventListener('click', () => {
    const btn = document.getElementById('reconnectBtn');
    btn.textContent = '🔄 Verbinde...';
    
    // Trigger Reconnect im Background-Script
    browser.runtime.sendMessage({ action: "reconnect" })
        .then(() => {
            setTimeout(() => {
                checkConnection();
                btn.textContent = '🔄 Neu Verbinden';
            }, 1000);
        });
});

// Initialisierung
checkConnection();

// Update Verbindungsstatus alle 3 Sekunden
setInterval(checkConnection, 3000);

// Listener für Stats-Updates
browser.runtime.onMessage.addListener((request) => {
    if (request.action === "stats_update") {
        stats = request.stats;
        updateStats();
        browser.storage.local.set({ stats: stats });
    }
});
