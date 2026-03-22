/**
 * Service to handle browser native notifications
 */

class NotificationService {
    constructor() {
        this.support = 'Notification' in window;
    }

    /**
     * Request permission to show notifications
     * This must be called from a user gesture (like clicking Login/Register)
     */
    async requestPermission() {
        if (!this.support) return false;
        
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Show a native notification
     * @param {string} title 
     * @param {Object} options 
     */
    async show(title, options = {}) {
        if (!this.support || Notification.permission !== 'granted') return;

        const defaultOptions = {
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            silent: false
        };

        const mergedOptions = { ...defaultOptions, ...options };

        // If we have a service worker, use it for better native integration
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration) {
                return registration.showNotification(title, mergedOptions);
            }
        }

        // Fallback to standard Notification API
        return new Notification(title, mergedOptions);
    }
}

export const notificationService = new NotificationService();
