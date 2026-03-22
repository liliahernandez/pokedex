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
        // STRATEGY: Tell the open App to accept using its own valid session.
        // The SW broadcasts to the app, and the app (which has the token in memory) does the API call.
        bc.postMessage({
            type: 'ACCEPT_FRIEND_REQUEST',
            requesterId: data.requesterId
        });

        // Also try to accept from SW background as a parallel attempt with DB token
        try {
            const token = await getFromDB(AUTH_STORE, 'token').catch(() => null);
            const apiUrlFromDB = await getFromDB(AUTH_STORE, 'apiUrl').catch(() => null);
            const cleanBaseUrl = (apiUrlFromDB || cachedApiUrl).replace(/\/+$/, '');

            console.log(`[SW] Background accept attempt | Token: ${token ? 'YES' : 'NO'}`);

            if (token) {
                const response = await fetch(`${cleanBaseUrl}/auth/friends`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ friendId: data.requesterId, action: 'accept_request' })
                });

                if (response.ok) {
                    console.log('[SW] Background accept succeeded!');
                    // Notify all clients to refresh
                    bc.postMessage({ type: 'REFRESH_FRIENDS' });
                    const windowClients = await clients.matchAll({ type: 'window' });
                    for (const client of windowClients) {
                        client.postMessage({ type: 'REFRESH_FRIENDS' });
                    }
                    self.registration.showNotification('¡Amistad Aceptada! 🤝', {
                        body: 'Ahora son amigos. ¡Genial!',
                        icon: '/icon.svg'
                    });
                    return;
                }
            }
        } catch (e) {
            console.warn('[SW] Background accept failed, app will handle:', e.message);
        }

        // Open the app so it can accept using its in-memory token
        await openOrFocusApp();
        return;
    }

    if (action === 'reject-friend') {
        // Just close, already done
        return;
    }

    if (action === 'accept-battle') {
        await openOrFocusApp();
        return;
    }

    // Default: just open the app
    await openOrFocusApp();
}
