<script setup>
import NavBar from './components/NavBar.vue';
import BattleInvite from './components/BattleInvite.vue';
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
            syncMessage.value = '📡 Estás offline: tu cambio se guardará y sincronizará solo.';
            if (syncBannerTimeout) clearTimeout(syncBannerTimeout);
        } else if (msg.type === 'SYNC_STARTED') {
            syncStatus.value = 'syncing';
            syncMessage.value = `⏳ Sincronizando tus cambios pendientes...`;
            if (syncBannerTimeout) clearTimeout(syncBannerTimeout);
        } else if (msg.type === 'SYNC_COMPLETED') {
            syncStatus.value = 'success';
            syncMessage.value = `✅ ¡Listo! Todo se ha sincronizado correctamente.`;
            
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
    <div class="sync-text">{{ syncMessage }}</div>
  </div>

  <NavBar />
  <BattleInvite v-if="userStore.activeChallenge" :challenge="userStore.activeChallenge" @close="userStore.activeChallenge = null" />
  <NotificationPermissionPrompt />
  <router-view></router-view>
</template>

<style scoped>
.global-sync-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    font-weight: 600;
    font-size: 0.9rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: fadeInDown 0.4s ease-out;
}
.global-sync-banner.pending {
    background: #fefce8;
    color: #854d0e;
    border-bottom: 3px solid #eab308;
}
.global-sync-banner.syncing {
    background: #eff6ff;
    color: #1e40af;
    border-bottom: 3px solid #3b82f6;
}
.global-sync-banner.success {
    background: #f0fdf4;
    color: #166534;
    border-bottom: 3px solid #22c55e; 
}

@keyframes fadeInDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
