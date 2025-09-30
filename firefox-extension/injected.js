/**
 * Injected Script für tiefere Captcha-Integration
 * Wird direkt in den Page-Context injiziert
 */

(function() {
    'use strict';
    
    console.log("[Injected] Captcha-Solver injiziert");
    
    // Überschreibe hCaptcha-API
    const originalHcaptcha = window.hcaptcha;
    
    window.hcaptcha = new Proxy(originalHcaptcha || {}, {
        get(target, prop) {
            if (prop === 'execute') {
                return async function(sitekey, options) {
                    console.log("[Injected] hCaptcha execute abgefangen:", sitekey);
                    
                    // Sende Event an Content-Script
                    window.postMessage({
                        type: 'HCAPTCHA_EXECUTE',
                        sitekey: sitekey,
                        options: options
                    }, '*');
                    
                    // Warte auf Antwort
                    return new Promise((resolve) => {
                        const listener = (event) => {
                            if (event.data.type === 'HCAPTCHA_TOKEN') {
                                window.removeEventListener('message', listener);
                                resolve(event.data.token);
                            }
                        };
                        window.addEventListener('message', listener);
                        
                        // Fallback nach 30 Sekunden
                        setTimeout(() => {
                            console.error("[Injected] Timeout beim Lösen");
                            resolve(null);
                        }, 30000);
                    });
                };
            }
            
            if (prop === 'render') {
                return function(container, config) {
                    console.log("[Injected] hCaptcha render abgefangen:", config);
                    
                    window.postMessage({
                        type: 'HCAPTCHA_RENDER',
                        container: container,
                        config: config
                    }, '*');
                    
                    // Rufe Original-Funktion auf
                    if (target[prop]) {
                        return target[prop].apply(this, arguments);
                    }
                };
            }
            
            return target[prop];
        }
    });
    
    // Überschreibe grecaptcha-API (reCaptcha)
    const originalGrecaptcha = window.grecaptcha;
    
    window.grecaptcha = new Proxy(originalGrecaptcha || {}, {
        get(target, prop) {
            if (prop === 'execute') {
                return async function(sitekey, options) {
                    console.log("[Injected] reCaptcha execute abgefangen:", sitekey);
                    
                    window.postMessage({
                        type: 'RECAPTCHA_EXECUTE',
                        sitekey: sitekey,
                        options: options
                    }, '*');
                    
                    return new Promise((resolve) => {
                        const listener = (event) => {
                            if (event.data.type === 'RECAPTCHA_TOKEN') {
                                window.removeEventListener('message', listener);
                                resolve(event.data.token);
                            }
                        };
                        window.addEventListener('message', listener);
                        
                        setTimeout(() => {
                            console.error("[Injected] Timeout beim Lösen");
                            resolve(null);
                        }, 30000);
                    });
                };
            }
            
            if (prop === 'render') {
                return function(container, config) {
                    console.log("[Injected] reCaptcha render abgefangen:", config);
                    
                    window.postMessage({
                        type: 'RECAPTCHA_RENDER',
                        container: container,
                        config: config
                    }, '*');
                    
                    if (target[prop]) {
                        return target[prop].apply(this, arguments);
                    }
                };
            }
            
            return target[prop];
        }
    });
    
    // Überwache Callback-Funktionen
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
        if (prop === 'callback' || prop === 'data-callback') {
            console.log("[Injected] Captcha-Callback registriert:", prop);
            
            const originalCallback = descriptor.value;
            descriptor.value = function(token) {
                console.log("[Injected] Captcha-Callback aufgerufen:", token?.substring(0, 50));
                
                window.postMessage({
                    type: 'CAPTCHA_CALLBACK',
                    token: token
                }, '*');
                
                if (originalCallback) {
                    return originalCallback.apply(this, arguments);
                }
            };
        }
        
        return originalDefineProperty.call(this, obj, prop, descriptor);
    };
    
    console.log("[Injected] ✓ Captcha-APIs überschrieben");
})();
