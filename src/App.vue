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
  <NavBar />
  <BattleNotification />
  <FriendRequestNotification />
  <NotificationPermissionPrompt />
  <router-view></router-view>
</template>

<style scoped>
</style>
