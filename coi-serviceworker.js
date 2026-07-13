/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
// Enhanced with automatic caching of model files and WebAssembly assets for high-speed, zero-server-load Edge AI execution.

let coepCredentialless = false;

if (typeof window === "undefined") {
    // --- SERVICE WORKER CONTEXT ---

    const CACHE_NAME = "edge-ai-studio-assets-v1";
    const CACHEABLE_EXTENSIONS = [".tflite", ".wasm", ".bin", ".task", ".json", ".wav"];
    const CACHEABLE_HOSTS = ["huggingface.co", "cdn.jsdelivr.net"];

    function shouldCache(url) {
        try {
            const urlObj = new URL(url);
            
            // Cache requests to Hugging Face and jsDelivr CDN
            if (CACHEABLE_HOSTS.some(host => urlObj.hostname.includes(host))) {
                return true;
            }
            
            // Cache requests to local files with specific extensions (models, WASM, assets)
            const path = urlObj.pathname.toLowerCase();
            if (CACHEABLE_EXTENSIONS.some(ext => path.endsWith(ext))) {
                return true;
            }
        } catch (err) {
            // Ignore malformed URLs
        }
        return false;
    }

    self.addEventListener("install", () => self.skipWaiting());
    
    self.addEventListener("activate", (e) => {
        e.waitUntil(self.clients.claim());
    });

    self.addEventListener("message", (e) => {
        if (e.data) {
            if ("deregister" === e.data.type) {
                self.registration.unregister()
                    .then(() => self.clients.matchAll())
                    .then((clients) => {
                        clients.forEach((client) => client.navigate(client.url));
                    });
            } else if ("coepCredentialless" === e.data.type) {
                coepCredentialless = e.data.value;
            }
        }
    });

    self.addEventListener("fetch", (e) => {
        const request = e.request;
        if ("only-if-cached" === request.cache && "same-origin" !== request.mode) {
            return;
        }

        const activeRequest = coepCredentialless && "no-cors" === request.mode 
            ? new Request(request, { credentials: "omit" }) 
            : request;

        e.respondWith(
            (async () => {
                const url = activeRequest.url;
                const cacheable = shouldCache(url);

                if (cacheable) {
                    try {
                        const cache = await caches.open(CACHE_NAME);
                        const cachedResponse = await cache.match(activeRequest);
                        if (cachedResponse) {
                            // console.log(`[ServiceWorker] Serving cached: ${url}`);
                            return addCoepHeaders(cachedResponse);
                        }
                    } catch (err) {
                        console.warn("[ServiceWorker] Cache lookup failed:", err);
                    }
                }

                try {
                    const response = await fetch(activeRequest);
                    if (response.status === 0) {
                        return response;
                    }

                    if (cacheable && response.status === 200) {
                        try {
                            const cache = await caches.open(CACHE_NAME);
                            // console.log(`[ServiceWorker] Caching resource: ${url}`);
                            await cache.put(activeRequest, response.clone());
                        } catch (err) {
                            console.warn("[ServiceWorker] Caching failed:", err);
                        }
                    }

                    return addCoepHeaders(response);
                } catch (err) {
                    console.error("[ServiceWorker] Fetch failed:", err);
                    throw err;
                }
            })()
        );
    });

    function addCoepHeaders(response) {
        const responseClone = response.clone();
        const headers = new Headers(responseClone.headers);
        
        headers.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
        if (!coepCredentialless) {
            headers.set("Cross-Origin-Resource-Policy", "cross-origin");
        }
        headers.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(responseClone.body, {
            status: responseClone.status,
            statusText: responseClone.statusText,
            headers: headers
        });
    }

} else {
    // --- BROWSER PAGE CONTEXT ---
    (() => {
        const coiReloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
        window.sessionStorage.removeItem("coiReloadedBySelf");
        
        const isDegraded = "coepdegrade" == coiReloadedBySelf;
        const config = {
            shouldRegister: () => !coiReloadedBySelf,
            shouldDeregister: () => false,
            coepCredentialless: () => true,
            coepDegrade: () => true,
            doReload: () => window.location.reload(),
            quiet: false,
            ...window.coi
        };

        const sw = navigator.serviceWorker;
        const controller = sw && sw.controller;

        if (controller && !window.crossOriginIsolated) {
            window.sessionStorage.setItem("coiCoepHasFailed", "true");
        }
        
        const coepHasFailed = window.sessionStorage.getItem("coiCoepHasFailed");

        if (controller) {
            const shouldDegrade = config.coepDegrade() && !(isDegraded || window.crossOriginIsolated);
            
            controller.postMessage({
                type: "coepCredentialless",
                value: !(shouldDegrade || coepHasFailed && config.coepDegrade()) && config.coepCredentialless()
            });

            if (shouldDegrade) {
                if (!config.quiet) console.log("Reloading page to degrade COEP.");
                window.sessionStorage.setItem("coiReloadedBySelf", "coepdegrade");
                config.doReload("coepdegrade");
            }
            
            if (config.shouldDeregister()) {
                controller.postMessage({ type: "deregister" });
            }
        }

        if (window.crossOriginIsolated === false && config.shouldRegister()) {
            if (window.isSecureContext) {
                if (sw) {
                    sw.register(window.document.currentScript.src).then(
                        (registration) => {
                            if (!config.quiet) console.log("COOP/COEP Service Worker registered", registration.scope);
                            
                            registration.addEventListener("updatefound", () => {
                                if (!config.quiet) console.log("Reloading page to use updated COOP/COEP Service Worker.");
                                window.sessionStorage.setItem("coiReloadedBySelf", "updatefound");
                                config.doReload();
                            });

                            if (registration.active && !sw.controller) {
                                if (!config.quiet) console.log("Reloading page to make use of COOP/COEP Service Worker.");
                                window.sessionStorage.setItem("coiReloadedBySelf", "notcontrolling");
                                config.doReload();
                            }
                        },
                        (err) => {
                            if (!config.quiet) console.error("COOP/COEP Service Worker failed to register:", err);
                        }
                    );
                } else {
                    if (!config.quiet) console.error("COOP/COEP Service Worker not registered, perhaps due to private mode.");
                }
            } else {
                if (!config.quiet) console.log("COOP/COEP Service Worker not registered, a secure context is required.");
            }
        }
    })();
}