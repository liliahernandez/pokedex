import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { getAuthToken, initDB } from './services/offlineStorage';
import { openDB } from 'idb';

self.skipWaiting();
clientsClaim();

// Precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

let dynamicApiUrl = 'https://pokedex-backend-production-494a.up.railway.app'; // Default fallback

// Message listener for SKIP_WAITING and CONFIG
self.addEventListener('message', (event) => {
    if (event.data) {
        if (event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
        }
        if (event.data.type === 'SET_CONFIG') {
            if (event.data.apiUrl) {
                dynamicApiUrl = event.data.apiUrl;
                console.log('[SW] API URL set to:', dynamicApiUrl);
            }
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

    const token = await getAuthToken();
    // Use dynamic URL, ensuring no trailing slash and cleaning it up
    const cleanBaseUrl = dynamicApiUrl.replace(/\/+$/, '');

    try {
        if (action === 'accept-friend' && data.requesterId) {
            // Try both routes (/auth and /api/auth) if needed, but the alias fix in BE handles both.
            // We use /auth as primary.
            const response = await fetch(`${cleanBaseUrl}/auth/friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ friendId: data.requesterId, action: 'accept_request' })
            });
            
            if (!response.ok) throw new Error(`API status: ${response.status}`);

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
        console.error('[SW] Action failed', error);
        self.registration.showNotification('Error 🤔', {
            body: `No se pudo procesar: ${error.message}. Abre la app.`,
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
