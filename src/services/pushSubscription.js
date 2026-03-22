import api from './api';

let pushEnabled = false;

/**
 * Gets the VAPID public key from the server
 */
async function getVapidPublicKey() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/push/vapid-public-key`);
    const data = await res.json();
    return data.publicKey;
}

/**
 * Converts a base64 URL-safe string to a Uint8Array (required for VAPID key)
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Subscribes the current user to Web Push notifications
 */
export async function subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Push notifications not supported');
        return false;
    }

    if (pushEnabled) return true;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('[Push] Permission not granted');
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = await getVapidPublicKey();
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
        });

        // Send subscription to our backend
        await api.post('/push/subscribe', {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
                auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
            }
        });

        console.log('[Push] Subscribed successfully');
        pushEnabled = true;
        return true;
    } catch (error) {
        console.error('[Push] Subscription error:', error);
        return false;
    }
}
