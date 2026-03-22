import axios from 'axios';
import { saveRequest } from './offlineStorage';

const api = axios.create({
    baseURL: 'http://192.168.100.71:3000', // Updated for mobile access
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add token to requests
api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('token');
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
        }
        return Promise.reject(error);
    }
);

export default api;
