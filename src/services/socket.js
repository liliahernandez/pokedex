import { io } from 'socket.io-client';

let socket;
const internalListeners = new Map();

/**
 * Centrally manages socket listeners so they persist across reconnections
 */
export const on = (event, callback) => {
    if (!internalListeners.has(event)) {
        internalListeners.set(event, new Set());
    }
    internalListeners.get(event).add(callback);
    
    // If socket is already alive, attach it immediately
    if (socket) {
        socket.on(event, callback);
    }
};

export const off = (event, callback) => {
    if (internalListeners.has(event)) {
        internalListeners.get(event).delete(callback);
    }
    if (socket) {
        socket.off(event, callback);
    }
};

export const initSocket = (token) => {
    if (socket) {
        socket.disconnect();
    }

    // Connect to the backend
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected');
        // Re-attach all registered listeners (cleaning up old ones if any)
        internalListeners.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                socket.off(event, callback); // Remove if exists
                socket.on(event, callback);  // Add fresh
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
