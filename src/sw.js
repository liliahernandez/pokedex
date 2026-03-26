import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

// Precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Persistent Config Helper
const DB_NAME = 'offline-store';
const AUTH_STORE = 'auth';
const bc = new BroadcastChannel('pokedex-sync');

const REQUESTS_STORE = 'requests';

function openDBNative() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(AUTH_STORE)) {
                db.createObjectStore(AUTH_STORE);
            }
            if (!db.objectStoreNames.contains(REQUESTS_STORE)) {
                db.createObjectStore(REQUESTS_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getFromDB(storeName, key) {
    return openDBNative().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function getAllRequests() {
    return openDBNative().then(db => {
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(REQUESTS_STORE)) return resolve([]);
            const transaction = db.transaction(REQUESTS_STORE, 'readonly');
            const store = transaction.objectStore(REQUESTS_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function saveToDB(storeName, key, value) {
    return openDBNative().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

function deleteRequestNative(id) {
    return openDBNative().then(db => {
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(REQUESTS_STORE)) return resolve();
            const transaction = db.transaction(REQUESTS_STORE, 'readwrite');
            const store = transaction.objectStore(REQUESTS_STORE);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

self.addEventListener('sync', (event) => {
    if (event.tag === 'replay-requests') {
        event.waitUntil(replayOfflineRequests());
    }
});

async function replayOfflineRequests() {
    try {
        const requests = await getAllRequests();
        if (!requests || requests.length === 0) return;

        console.log(`[SW] Background Sync sorting ${requests.length} pending offline requests...`);
        bc.postMessage({ type: 'SYNC_STARTED', count: requests.length });
        
        const token = await getFromDB(AUTH_STORE, 'token');
        let successCount = 0;

        for (const req of requests) {
            try {
                const headers = req.headers || {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const fetchOptions = {
                    method: req.method,
                    headers: headers,
                };

                if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
                    fetchOptions.body = JSON.stringify(req.body);
                }

                const response = await fetch(req.url, fetchOptions);

                // If request was successful or rejected by server (not a network issue), remove it from queue
                if (response.ok || response.status < 500) {
                    console.log(`[SW] Replay successful for: ${req.url}`);
                    await deleteRequestNative(req.id);
                    successCount++;
                }
            } catch (error) {
                console.error('[SW] Replay failed (still offline) for:', req.url, error);
                // Keep it in IDB, it will be retried on next sync event
            }
        }
        
        if (successCount > 0) {
            bc.postMessage({ type: 'SYNC_COMPLETED', count: successCount });
        }

    } catch (err) {
        console.error('[SW] Error reading requests from IDB:', err);
    }
}

let cachedApiUrl = 'https://be-production-c80c.up.railway.app'; 

// Message listener
self.addEventListener('message', (event) => {
    if (event.data) {
        if (event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
        }
        if (event.data.type === 'SET_CONFIG' && event.data.apiUrl) {
            cachedApiUrl = event.data.apiUrl;
            saveToDB(AUTH_STORE, 'apiUrl', event.data.apiUrl).catch(() => {});
            console.log('[SW] API URL updated:', cachedApiUrl);
        }
    }
});

// Web Push Event Handler (triggered when a push message arrives from the server)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = { title: 'Pokédex', body: event.data.text() };
    }

    const title = payload.title || 'Pokédex';
    const options = {
        body: payload.body || '',
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: payload.data?.action || 'general',
        renotify: true,
        data: payload.data || {},
        actions: []
    };

    // Add action buttons based on notification type
    if (payload.data?.action === 'accept-friend') {
        options.actions = [
            { action: 'accept-friend', title: '✅ ACEPTAR' },
            { action: 'reject-friend', title: '❌ RECHAZAR' }
        ];
    }

    if (payload.data?.action === 'accept-battle') {
        options.actions = [
            { action: 'accept-battle', title: '⚔️ IR A BATALLA' }
        ];
        options.tag = `battle-${payload.data.battleId}`;
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    notification.close();
    event.waitUntil(handleNotificationAction(action, data));
});

async function openOrFocusApp(urlHash) {
    const baseUrl = new URL('/', self.location.origin).href;
    const targetUrl = urlHash ? baseUrl + urlHash : baseUrl;
    
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    
    // Try to focus any existing window and send message
    for (let client of windowClients) {
        if ('focus' in client) {
            await client.focus();
            // Give the app a moment to gain focus, then send the action
            return client;
        }
    }
    
    // No window open: open the app
    if (clients.openWindow) {
        return clients.openWindow(targetUrl);
    }
}

async function handleNotificationAction(action, data) {
    console.log(`[SW] Notification action: ${action}`, data);

    if (action === 'accept-friend' && data.requesterId) {
        // Save the pending accept to localStorage — the app reads this on load after auth
        // This is the most reliable approach: no timing issues, works even when app was closed
        try {
            // Use clients API to set localStorage in any open window
            const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
            
            if (windowClients.length > 0) {
                // App is open — send it a message directly
                for (const client of windowClients) {
                    client.postMessage({
                        type: 'ACCEPT_FRIEND_REQUEST',
                        requesterId: data.requesterId
                    });
                }
                // Also focus the app
                await windowClients[0].focus();
            } else {
                // App is closed — open with URL param as backup signal
                const acceptUrl = new URL('/', self.location.origin);
                acceptUrl.searchParams.set('accept-friend', data.requesterId);
                await clients.openWindow(acceptUrl.href);
            }
        } catch (e) {
            console.error('[SW] Error handling accept-friend:', e);
            await openOrFocusApp();
        }
        return;
    }

    if (action === 'reject-friend') {
        return;
    }

    if (action === 'accept-battle' && data.battleId) {
        const battleUrl = `/#/battle/${data.battleId}`;
        await openOrFocusApp(battleUrl);
        return;
    }

    if (data.action === 'view-friends' || action === 'view-friends') {
        await openOrFocusApp('/#/friends');
        return;
    }

    if (action === 'accept-battle') {
        await openOrFocusApp();
        return;
    }

    // Default: just open the app
    await openOrFocusApp();
}
