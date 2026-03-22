import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { openDB } from 'idb';

self.skipWaiting();
clientsClaim();

// Precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Persistent Config Helper
const DB_NAME = 'offline-store';
const AUTH_STORE = 'auth';

async function getStoredConfig() {
    try {
        const db = await openDB(DB_NAME, 1);
        const token = await db.get(AUTH_STORE, 'token');
        const apiUrl = await db.get(AUTH_STORE, 'apiUrl');
        return { token, apiUrl };
    } catch (e) {
        console.error('[SW] Config retrieval failed', e);
        return {};
    }
}

async function saveApiUrl(url) {
    try {
        const db = await openDB(DB_NAME, 1);
        await db.put(AUTH_STORE, url, 'apiUrl');
    } catch (e) {}
}

let cachedApiUrl = 'https://pokedex-backend-production-494a.up.railway.app'; 

// Message listener for SKIP_WAITING and CONFIG
self.addEventListener('message', (event) => {
    if (event.data) {
        if (event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
        }
        if (event.data.type === 'SET_CONFIG' && event.data.apiUrl) {
            cachedApiUrl = event.data.apiUrl;
            saveApiUrl(event.data.apiUrl);
            console.log('[SW] API URL updated and stored:', cachedApiUrl);
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

    const { token, apiUrl } = await getStoredConfig();
    const activeApiUrl = apiUrl || cachedApiUrl;
    const cleanBaseUrl = activeApiUrl.replace(/\/+$/, '');

    console.log(`[SW] Handling action: ${action} with API: ${cleanBaseUrl}`);

    try {
        if (action === 'accept-friend' && data.requesterId) {
            if (!token) throw new Error('No hay sesión activa. Abre la app.');

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
                throw new Error(errData.error || `Error ${response.status}`);
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
