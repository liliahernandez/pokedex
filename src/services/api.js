import axios from 'axios';
import { saveRequest, getAuthToken } from './offlineStorage';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add token to requests
api.interceptors.request.use(async config => {
    // 1. Try sessionStorage (fastest)
    let token = sessionStorage.getItem('token');
    
    // 2. Try IndexedDB (fallback for PWAs)
    if (!token) {
        token = await getAuthToken();
    }
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Interceptor to handle offline errors
api.interceptors.response.use(
    response => response,
    async error => {
        if (!error.response && error.message === 'Network Error') {
            // Network error (offline)
            console.log('[API] Network Error detected. Saving request for background sync.');

            const config = error.config;
            const requestData = {
                url: config.url.startsWith('http') ? config.url : config.baseURL + config.url,
                method: config.method,
                headers: config.headers,
                body: config.data ? JSON.parse(config.data) : null,
                timestamp: Date.now()
            };

            try {
                await saveRequest(requestData);

                // Register Sync if SW is ready
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('replay-requests');
                    console.log('[API] Background Sync registered');
                }
            } catch (storageError) {
                console.error('[API] Failed to save offline request', storageError);
            }
            // Notify global UI via BroadcastChannel
            const bc = new BroadcastChannel('pokedex-sync');
            bc.postMessage({ type: 'SYNC_PENDING' });

            // Return a custom rejection so the UI can silently ignore it
            return Promise.reject({
                isOfflineSync: true,
                message: 'Offline Sync pending'
            });
        }
        return Promise.reject(error);
    }
);

export default api;
