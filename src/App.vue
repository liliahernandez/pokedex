<script setup>
import NavBar from './components/NavBar.vue';
import BattleNotification from './components/BattleNotification.vue';
import FriendRequestNotification from './components/FriendRequestNotification.vue';
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt.vue';
import { useUserStore } from './stores/user';
import { useAuthStore } from './stores/auth';
import { watch, ref, onMounted } from 'vue'; // Added ref and onMounted

const userStore = useUserStore();
const authStore = useAuthStore();
const pwaUpdateAvailable = ref(false);

// Function to handle PWA update
const updateApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // This message will trigger the service worker to skip waiting
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        // Reload the page after the service worker has updated
        window.location.reload();
    }
};

// Start global listeners when authenticated
watch(() => authStore.isAuthenticated, (val) => {
    if (val) {
        userStore.listenForFriendEvents();
    }
}, { immediate: true });

// PWA Update Logic
onMounted(async () => {
    // Restore authentication from storage (critical for PWA)
    await authStore.initAuth();

    if ('serviceWorker' in navigator) {
        // Detect update available
        navigator.serviceWorker.ready.then(registration => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        pwaUpdateAvailable.value = true;
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
        navigator.serviceWorker.ready.then(registration => {
            if (registration.active) {
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
  <div v-if="pwaUpdateAvailable" class="update-banner">
    🚀 ¡Nueva versión disponible! 
    <button @click="updateApp">ACTUALIZAR AHORA</button>
  </div>
  <NavBar />
  <BattleNotification />
  <FriendRequestNotification />
  <NotificationPermissionPrompt />
  <router-view></router-view>
</template>

<style scoped>
.update-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #4ade80; /* Success Green */
    color: #1a202c;
    padding: 1rem;
    text-align: center;
    z-index: 10000;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}

.update-banner button {
    background: #1a202c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
}

.update-banner button:hover {
    transform: scale(1.05);
}
</style>
