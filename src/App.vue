<script setup>
import NavBar from './components/NavBar.vue';
import BattleNotification from './components/BattleNotification.vue';
import FriendRequestNotification from './components/FriendRequestNotification.vue';
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt.vue';
import { useUserStore } from './stores/user';
import { useAuthStore } from './stores/auth';
import { watch, ref, onMounted } from 'vue';
import { subscribeToPushNotifications } from './services/pushSubscription';

const userStore = useUserStore();
const authStore = useAuthStore();

const syncStatus = ref(null);
const syncMessage = ref('');
let syncBannerTimeout = null;

// Start global listeners when authenticated
watch(() => authStore.isAuthenticated, (val) => {
    if (val) {
        userStore.listenForFriendEvents();
        // Subscribe to Web Push notifications after login
        subscribeToPushNotifications().catch(e => console.warn('[Push] Could not subscribe:', e));
    }
}, { immediate: true });

// PWA Update Logic
onMounted(async () => {
    // Restore authentication from storage (critical for PWA)
    await authStore.initAuth();

    // Handle notification actions passed via URL params (e.g., accept-friend from SW)
    const urlParams = new URLSearchParams(window.location.search);
    const acceptFriendId = urlParams.get('accept-friend');
    if (acceptFriendId && authStore.isAuthenticated) {
        console.log('[App] Auto-accepting friend request from URL param:', acceptFriendId);
        try {
            await userStore.acceptFriendRequest(acceptFriendId);
            await userStore.fetchFriends();
            console.log('[App] Friend request accepted successfully!');
        } catch (e) {
            console.error('[App] Error accepting friend request:', e);
        }
        // Clean the URL so it doesn't re-trigger on refresh
        window.history.replaceState({}, '', '/');
    }

    // Background Sync Listeners for Global Banner
    const syncChannel = new BroadcastChannel('pokedex-sync');
    syncChannel.onmessage = (event) => {
        const msg = event.data;
        if (msg.type === 'SYNC_PENDING') {
            syncStatus.value = 'pending';
            syncMessage.value = 'Sin internet: tu acción quedó pendiente y se enviará automáticamente.';
            if (syncBannerTimeout) clearTimeout(syncBannerTimeout);
        } else if (msg.type === 'SYNC_STARTED') {
            syncStatus.value = 'syncing';
            syncMessage.value = `Sincronizando ${msg.count} petición(es) pendientes...`;
            if (syncBannerTimeout) clearTimeout(syncBannerTimeout);
        } else if (msg.type === 'SYNC_COMPLETED') {
            syncStatus.value = 'success';
            syncMessage.value = `Sincronización completada: ${msg.count} petición(es) enviadas.`;
            
            // Auto-refresh data invisibly
            if (authStore.isAuthenticated) {
                userStore.fetchFriends();
                userStore.fetchFavorites();
                userStore.fetchTeams();
            }

            if (syncBannerTimeout) clearTimeout(syncBannerTimeout);
            syncBannerTimeout = setTimeout(() => {
                if (syncStatus.value === 'success') syncStatus.value = null;
            }, 5000);
        }
    };

    window.addEventListener('online', () => {
        if (syncStatus.value === 'pending') {
            navigator.serviceWorker.ready.then(reg => {
                if(reg.sync) reg.sync.register('replay-requests');
            });
        }
    });

    if ('serviceWorker' in navigator) {
        // Automatically skip waiting for new versions
        navigator.serviceWorker.ready.then(registration => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Automate skipwaiting
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
        
        // Check for updates every 5 minutes
        setInterval(() => {
            navigator.serviceWorker.ready.then(reg => reg.update());
        }, 1000 * 60 * 5);

        // Sync API URL to Service Worker
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        console.log('[DEBUG] App API URL:', apiUrl);
        
        navigator.serviceWorker.ready.then(registration => {
            if (registration.active) {
                console.log('[DEBUG] Syncing URL to SW:', apiUrl);
                registration.active.postMessage({ 
                    type: 'SET_CONFIG', 
                    apiUrl: apiUrl
                });
            }
        });
    }
});
</script>

<template>
  <div v-if="syncStatus" :class="['global-sync-banner', syncStatus]">
    <div class="sync-icon">
        <span v-if="syncStatus === 'pending'">📡</span>
        <span v-else-if="syncStatus === 'syncing'">⏳</span>
        <span v-else-if="syncStatus === 'success'">✅</span>
    </div>
    <div class="sync-text">{{ syncMessage }}</div>
  </div>

  <NavBar />
  <BattleNotification />
  <FriendRequestNotification />
  <NotificationPermissionPrompt />
  <router-view></router-view>
</template>

<style scoped>
.global-sync-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 24px;
    font-weight: 600;
    font-size: 0.95rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
}
.global-sync-banner.pending {
    background: #dcfce7;
    color: #166534;
    border-left: 6px solid #22c55e;
}
.global-sync-banner.syncing {
    background: #fef08a;
    color: #854d0e;
    border-left: 6px solid #eab308;
}
.global-sync-banner.success {
    background: #dcfce7;
    color: #166534;
    border-left: 6px solid #3b82f6; 
}
</style>
