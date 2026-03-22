import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { getAuthToken } from './services/offlineStorage';

self.skipWaiting();
clientsClaim();

// Precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    console.log(`[SW] Notification clicked: ${action}`, data);

    if (!action) {
        // Just clicking the notification itself (not a button)
        event.waitUntil(focusOrOpenApp());
        notification.close();
        return;
    }

    // Handle Buttons
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
    const token = await getAuthToken();
    const API_URL = 'https://pokedex-backend-production-494a.up.railway.app'; // Production URL fallback

    try {
        if (action === 'accept-friend' && data.requesterId) {
            await fetch(`${API_URL}/api/auth/friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ friendId: data.requesterId, action: 'accept_request' })
            });
            
            self.registration.showNotification('¡Amistad Aceptada! 🤝', {
                body: 'Ahora son amigos. ¡Genial!',
                icon: '/icon.svg'
            });
        }
        
        if (action === 'reject-friend' && data.requesterId) {
            // Optional: Call delete or just dismiss
            notification.close();
        }

        if (action === 'accept-battle') {
            // Focus app to start battle
            await focusOrOpenApp();
        }

    } catch (error) {
        console.error('[SW] Action failed', error);
        // Fallback: open app
        await focusOrOpenApp();
    } finally {
        notification.close();
    }
}
