import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { initDB, getRequests, deleteRequest } from './services/offlineStorage';

self.skipWaiting();
clientsClaim();

// Precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Background Sync Logic
const SYNC_TAG = 'replay-requests';

self.addEventListener('sync', (event) => {
    if (event.tag === SYNC_TAG) {
        event.waitUntil(replayRequests());
    }
});

async function replayRequests() {
    try {
        const requests = await getRequests();
        console.log(`[SW] Replaying ${requests.length} requests...`);

        for (const req of requests) {
            try {
                const response = await fetch(req.url, {
                    method: req.method,
                    headers: req.headers,
                    body: req.body ? JSON.stringify(req.body) : null,
                });

                if (response.ok) {
                    console.log(`[SW] Request to ${req.url} succeeded.`);
                    await deleteRequest(req.id);
                } else {
                    console.error(`[SW] Request to ${req.url} failed with status ${response.status}`);
                    // Optional: decide whether to keep it or delete it based on status
                }
            } catch (error) {
                console.error(`[SW] Network error replaying request to ${req.url}`, error);
                // Keep in DB to try again later
            }
        }
    } catch (error) {
        console.error('[SW] Error replaying requests:', error);
    }
}
