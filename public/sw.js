self.addEventListener('install', (event) => {
    console.log('SW: Installing...');
    const cachePromise = caches.open('appShell_v1').then((cache) => {
        return cache.addAll([
            '/',
            '/index.html',
            '/src/main.js',
            '/src/assets/main.css'
        ]);
    });
    event.waitUntil(cachePromise);
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method === "GET") {
        const resp = fetch(event.request)
            .then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    // Cache external resources too if needed, but 'basic' ensures safety for same-origin
                    // For API, we might want to cache opaque responses too? 
                    // Let's stick to the simple logic from screenshot: put everything we get.
                }

                return caches.open('dynamic_v1.0').then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            })
            .catch((err) => {
                console.log('SW: Fetch failed, falling back to cache');
                return caches.match(event.request);
            });

        event.respondWith(resp);
    }
});
