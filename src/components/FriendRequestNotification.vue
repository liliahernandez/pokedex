<script setup>
import { onMounted, onUnmounted } from 'vue';
import * as socketService from '../services/socket';
import { notificationService } from '../services/notifications';

const handleFriendRequest = (data) => {
    // Removed native notification here because the backend already sends a 
    // Web Push notification (sw.js), which was causing duplicate native notifications.
    console.log('[Socket] Friend request received:', data);
};

onMounted(() => {
    socketService.on('friend_request', handleFriendRequest);
});

onUnmounted(() => {
    socketService.off('friend_request', handleFriendRequest);
});
</script>

<template>
  <!-- No in-app UI, using native system notifications only as requested -->
</template>

<style scoped>
</style>
