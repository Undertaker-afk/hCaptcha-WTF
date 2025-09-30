/**
 * Content Script für Captcha Auto-Solver
 * Erkennt Captchas und koordiniert die Lösung
 */

console.log("[Content] Captcha Auto-Solver geladen");

let isEnabled = true;
let currentMousePath = null;
let mousePathIndex = 0;

/**
 * Erkenne hCaptcha auf der Seite
 */
function detectHCaptcha() {
    // Suche nach hCaptcha-Iframe
    const hcaptchaIframes = document.querySelectorAll('iframe[src*="hcaptcha.com"]');
    
    if (hcaptchaIframes.length > 0) {
        console.log("[Content] hCaptcha erkannt:", hcaptchaIframes.length);
        return Array.from(hcaptchaIframes);
    }
    
    return [];
}

/**
 * Erkenne reCaptcha auf der Seite
 */
function detectReCaptcha() {
    // Suche nach reCaptcha-Iframe oder Div
    const recaptchaIframes = document.querySelectorAll('iframe[src*="recaptcha"]');
    const recaptchaDivs = document.querySelectorAll('.g-recaptcha, .recaptcha');
    
    if (recaptchaIframes.length > 0 || recaptchaDivs.length > 0) {
        console.log("[Content] reCaptcha erkannt");
        return {iframes: Array.from(recaptchaIframes), divs: Array.from(recaptchaDivs)};
    }
    
    return null;
}

/**
 * Extrahiere Sitekey aus hCaptcha
 */
function extractHCaptchaSitekey() {
    // Versuche Sitekey aus verschiedenen Quellen zu extrahieren
    
    // 1. Von hCaptcha-Container
    const hcaptchaDiv = document.querySelector('[data-sitekey]');
    if (hcaptchaDiv) {
        return hcaptchaDiv.getAttribute('data-sitekey');
    }
    
    // 2. Von Iframe-Src
    const iframe = document.querySelector('iframe[src*="hcaptcha.com"]');
    if (iframe) {
        const src = iframe.src;
        const match = src.match(/sitekey=([^&]+)/);
        if (match) {
            return match[1];
        }
    }
    
    // 3. Von Script-Tags
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        const content = script.textContent || script.innerHTML;
        const match = content.match(/sitekey['":\s]+([a-f0-9-]+)/i);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

/**
 * Extrahiere Sitekey aus reCaptcha
 */
function extractReCaptchaSitekey() {
    // 1. Von reCaptcha-Container
    const recaptchaDiv = document.querySelector('.g-recaptcha[data-sitekey]');
    if (recaptchaDiv) {
        return recaptchaDiv.getAttribute('data-sitekey');
    }
    
    // 2. Von Iframe-Src
    const iframe = document.querySelector('iframe[src*="recaptcha"]');
    if (iframe) {
        const src = iframe.src;
        const match = src.match(/k=([^&]+)/);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

/**
 * Simuliere menschliche Mausbewegung
 */
function simulateMouseMovement(path) {
    return new Promise((resolve) => {
        let index = 0;
        
        function moveStep() {
            if (index >= path.length) {
                resolve();
                return;
            }
            
            const [x, y] = path[index];
            
            // Erstelle und dispatche MouseMove-Event
            const event = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            });
            
            document.dispatchEvent(event);
            
            index++;
            
            // Delay zwischen Bewegungen (1-3ms für Realismus)
            setTimeout(moveStep, Math.random() * 2 + 1);
        }
        
        moveStep();
    });
}

/**
 * Löse hCaptcha
 */
async function solveHCaptcha() {
    console.log("[Content] Starte hCaptcha-Lösung...");
    
    const sitekey = extractHCaptchaSitekey();
    if (!sitekey) {
        console.error("[Content] Konnte Sitekey nicht extrahieren");
        return;
    }
    
    console.log("[Content] Sitekey:", sitekey);
    console.log("[Content] URL:", window.location.href);
    
    // Fordere Lösung vom Background-Script an
    browser.runtime.sendMessage({
        action: "solve_hcaptcha",
        sitekey: sitekey,
        url: window.location.href,
        proxy: null
    });
    
    // Zeige Notification
    showNotification("hCaptcha wird gelöst...", "info");
}

/**
 * Löse reCaptcha
 */
async function solveReCaptcha() {
    console.log("[Content] Starte reCaptcha-Lösung...");
    
    const sitekey = extractReCaptchaSitekey();
    if (!sitekey) {
        console.error("[Content] Konnte Sitekey nicht extrahieren");
        return;
    }
    
    console.log("[Content] Sitekey:", sitekey);
    
    browser.runtime.sendMessage({
        action: "solve_recaptcha",
        sitekey: sitekey,
        url: window.location.href
    });
    
    showNotification("reCaptcha wird gelöst...", "info");
}

/**
 * Füge Token ins Captcha-Formular ein
 */
function injectToken(token, type) {
    console.log("[Content] Füge Token ein:", token.substring(0, 50) + "...");
    
    if (type === "hcaptcha") {
        // Suche nach hCaptcha-Response-Textareas
        const responseFields = document.querySelectorAll('textarea[name="h-captcha-response"], textarea[name="g-recaptcha-response"]');
        
        responseFields.forEach(field => {
            field.value = token;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Trigger Callback falls vorhanden
        if (window.hcaptcha && window.hcaptcha.callback) {
            window.hcaptcha.callback(token);
        }
        
        console.log("[Content] ✓ hCaptcha-Token eingefügt");
        showNotification("hCaptcha gelöst! ✓", "success");
    } else if (type === "recaptcha") {
        // reCaptcha-Token-Injection
        const responseFields = document.querySelectorAll('textarea[name="g-recaptcha-response"]');
        
        responseFields.forEach(field => {
            field.value = token;
            field.dispatchEvent(new Event('input', { bubbles: true }));
        });
        
        // Trigger Callback
        if (window.grecaptcha && window.grecaptcha.callback) {
            window.grecaptcha.callback(token);
        }
        
        console.log("[Content] ✓ reCaptcha-Token eingefügt");
        showNotification("reCaptcha gelöst! ✓", "success");
    }
}

/**
 * Zeige Notification
 */
function showNotification(message, type = "info") {
    // Erstelle Notification-Element
    const notification = document.createElement('div');
    notification.className = `captcha-solver-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Entferne nach 3 Sekunden
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Listener für Nachrichten vom Background-Script
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[Content] Nachricht empfangen:", request.action);
    
    switch (request.action) {
        case "captcha_result":
            if (request.success && request.token) {
                injectToken(request.token, request.type);
            } else {
                showNotification(`Fehler beim Lösen: ${request.error}`, "error");
            }
            break;
        
        case "mouse_path":
            currentMousePath = request.path;
            mousePathIndex = 0;
            console.log("[Content] Mausbewegungspfad empfangen:", request.path.length, "Punkte");
            break;
        
        case "client_connected":
            console.log("[Content] ✓ Python-Client verbunden");
            break;
        
        case "solve_now":
            // Manueller Trigger
            if (detectHCaptcha().length > 0) {
                solveHCaptcha();
            } else if (detectReCaptcha()) {
                solveReCaptcha();
            }
            break;
    }
    
    sendResponse({success: true});
    return true;
});

/**
 * Auto-Detect und Auto-Solve
 */
function checkForCaptchas() {
    if (!isEnabled) return;
    
    // Prüfe auf hCaptcha
    const hcaptchas = detectHCaptcha();
    if (hcaptchas.length > 0) {
        console.log("[Content] Auto-Solve: hCaptcha erkannt");
        setTimeout(() => solveHCaptcha(), 1000); // Kurze Verzögerung
    }
    
    // Prüfe auf reCaptcha
    const recaptcha = detectReCaptcha();
    if (recaptcha) {
        console.log("[Content] Auto-Solve: reCaptcha erkannt");
        setTimeout(() => solveReCaptcha(), 1000);
    }
}

/**
 * Initialisierung
 */
console.log("[Content] Initialisiere Captcha-Erkennung...");

// Prüfe initial
checkForCaptchas();

// Überwache DOM-Änderungen
const observer = new MutationObserver(() => {
    checkForCaptchas();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// CSS für Animationen
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
