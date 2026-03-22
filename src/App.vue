<script setup>
import NavBar from './components/NavBar.vue';
import BattleNotification from './components/BattleNotification.vue';
import FriendRequestNotification from './components/FriendRequestNotification.vue';
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt.vue';
import { useUserStore } from './stores/user';
import { useAuthStore } from './stores/auth';
import { watch } from 'vue';

const userStore = useUserStore();
const authStore = useAuthStore();

// Start global listeners when authenticated
watch(() => authStore.isAuthenticated, (val) => {
    if (val) {
        userStore.listenForFriendEvents();
    }
}, { immediate: true });
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
