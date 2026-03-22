import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

// Precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Persistent Config Helper (Native IDB to avoid ES Module issues in some browsers)
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

// Message listener for SKIP_WAITING and CONFIG
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

    event.waitUntil(handleNotificationAction(action, data, notification));
});

async function focusOrOpenApp() {
    const urlToOpen = new URL('/', self.location.origin).href;
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    
    for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
        }
    }
    
    if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
    }
}

async function handleNotificationAction(action, data, notification) {
    if (!action) {
        await focusOrOpenApp();
        notification.close();
        return;
    }

    // Get config from DB
    console.log('[SW] Attempting to retrieve token from DB...');
    const token = await getFromDB(AUTH_STORE, 'token').catch((err) => {
        console.error('[SW] DB Error:', err);
        return null;
    });
    
    const apiUrlFromDB = await getFromDB(AUTH_STORE, 'apiUrl').catch(() => null);
    const activeApiUrl = apiUrlFromDB || cachedApiUrl;
    const cleanBaseUrl = activeApiUrl.replace(/\/+$/, '');

    console.log(`[SW] Action: ${action} | Token: ${token ? 'YES' : 'NO'} | API: ${cleanBaseUrl}`);

    // Notify the open App (if any) to assist with the action
    bc.postMessage({
        type: 'NOTIFICATION_ACTION',
        action,
        data,
        token
    });

    try {
        if (action === 'accept-friend' && data.requesterId) {
            if (!token) throw new Error('No hay sesión. Abre la app.');

            const response = await fetch(`${cleanBaseUrl}/auth/friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ friendId: data.requesterId, action: 'accept_request' })
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Servidor: ${response.status}`);
            }

            self.registration.showNotification('¡Amistad Aceptada! 🤝', {
                body: 'Ahora son amigos. ¡Genial!',
                icon: '/icon.svg'
            });

            await notifyClientsToRefresh();
        }
        
        if (action === 'reject-friend') {
            notification.close();
        }

        if (action === 'accept-battle') {
            await focusOrOpenApp();
        }

    } catch (error) {
        console.error('[SW] Action failed:', error);
        self.registration.showNotification('Error 🤔', {
            body: `${error.message}`,
            icon: '/icon.svg'
        });
        await focusOrOpenApp();
    } finally {
        notification.close();
    }
}

async function notifyClientsToRefresh() {
    const windowClients = await clients.matchAll({ type: 'window' });
    for (const client of windowClients) {
        client.postMessage({ type: 'REFRESH_FRIENDS' });
    }
}
