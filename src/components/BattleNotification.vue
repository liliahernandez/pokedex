<script setup>
import { onMounted, onUnmounted } from 'vue';
import * as socketService from '../services/socket';
import { notificationService } from '../services/notifications';

const handleBattleRequest = (data) => {
    // Removed native notification here because the backend already sends a 
    // Web Push notification (sw.js), which was causing duplicate native notifications.
    console.log('[Socket] Battle request received:', data);
};

onMounted(() => {
    socketService.on('battle_request', handleBattleRequest);
});

onUnmounted(() => {
    socketService.off('battle_request', handleBattleRequest);
});
</script>

<template>
  <!-- No in-app UI, using native system notifications only as requested -->
</template>

<style scoped>
</style>
