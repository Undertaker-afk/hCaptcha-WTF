/**
 * Background Script für Captcha Auto-Solver
 * Verwaltet WebSocket-Verbindung zum Python-Client
 */

let ws = null;
let reconnectInterval = null;
const WS_URL = "ws://localhost:8765";

// Status
let isConnected = false;
let solveQueue = [];

/**
 * Verbindung zum Python-Client herstellen
 */
function connectToClient() {
    console.log("[Background] Verbinde zu Python-Client...");
    
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log("[Background] ✓ Verbunden mit Python-Client");
            isConnected = true;
            
            // Stoppe Reconnect-Versuche
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            
            // Benachrichtige alle Tabs
            browser.tabs.query({}).then(tabs => {
                tabs.forEach(tab => {
                    browser.tabs.sendMessage(tab.id, {
                        action: "client_connected"
                    }).catch(() => {});
                });
            });
            
            // Verarbeite Queue
            processQueue();
        };
        
        ws.onmessage = (event) => {
            console.log("[Background] Nachricht empfangen:", event.data);
            handleMessage(JSON.parse(event.data));
        };
        
        ws.onerror = (error) => {
            console.error("[Background] WebSocket-Fehler:", error);
        };
        
        ws.onclose = () => {
            console.log("[Background] Verbindung geschlossen");
            isConnected = false;
            ws = null;
            
            // Versuche Reconnect
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    console.log("[Background] Reconnect-Versuch...");
                    connectToClient();
                }, 5000);
            }
        };
    } catch (error) {
        console.error("[Background] Fehler beim Verbinden:", error);
    }
}

/**
 * Nachricht an Python-Client senden
 */
function sendToClient(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        return true;
    } else {
        console.warn("[Background] Nicht verbunden, füge zur Queue hinzu");
        solveQueue.push(data);
        return false;
    }
}

/**
 * Verarbeite Queue von ausstehenden Anfragen
 */
function processQueue() {
    while (solveQueue.length > 0 && isConnected) {
        const data = solveQueue.shift();
        sendToClient(data);
    }
}

/**
 * Verarbeite Antworten vom Python-Client
 */
function handleMessage(data) {
    const action = data.action;
    
    switch (action) {
        case "captcha_result":
            // Weiterleiten an Content-Script
            browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
                if (tabs[0]) {
                    browser.tabs.sendMessage(tabs[0].id, data);
                }
            });
            break;
        
        case "mouse_path":
            // Weiterleiten an Content-Script
            browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
                if (tabs[0]) {
                    browser.tabs.sendMessage(tabs[0].id, data);
                }
            });
            break;
        
        case "pong":
            console.log("[Background] Pong empfangen");
            break;
        
        case "error":
            console.error("[Background] Fehler vom Client:", data.error);
            break;
        
        default:
            console.warn("[Background] Unbekannte Aktion:", action);
    }
}

/**
 * Listener für Nachrichten von Content-Scripts
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[Background] Nachricht von Content-Script:", request.action);
    
    switch (request.action) {
        case "solve_hcaptcha":
            sendToClient({
                action: "solve_hcaptcha",
                sitekey: request.sitekey,
                url: request.url,
                proxy: request.proxy
            });
            sendResponse({success: true});
            break;
        
        case "solve_recaptcha":
            sendToClient({
                action: "solve_recaptcha",
                sitekey: request.sitekey,
                url: request.url
            });
            sendResponse({success: true});
            break;
        
        case "get_mouse_path":
            sendToClient({
                action: "get_mouse_path",
                start: request.start,
                end: request.end,
                steps: request.steps || 50
            });
            sendResponse({success: true});
            break;
        
        case "is_connected":
            sendResponse({connected: isConnected});
            break;
        
        default:
            console.warn("[Background] Unbekannte Aktion:", request.action);
            sendResponse({success: false, error: "Unbekannte Aktion"});
    }
    
    return true; // Async response
});

/**
 * Initialisierung
 */
console.log("[Background] Captcha Auto-Solver Extension gestartet");
connectToClient();

// Ping alle 30 Sekunden
setInterval(() => {
    if (isConnected) {
        sendToClient({action: "ping"});
    }
}, 30000);
