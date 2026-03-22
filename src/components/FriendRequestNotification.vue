<script setup>
import { onMounted, onUnmounted } from 'vue';
import * as socketService from '../services/socket';
import { notificationService } from '../services/notifications';

const handleFriendRequest = (data) => {
    // ONLY native notification as requested
    notificationService.show('Solicitud de Amistad 🤝', {
        body: `${data.requesterName || data.requesterEmail} quiere ser tu amigo.`,
        tag: 'friend-request',
        renotify: true,
        vibrate: [200, 100, 200],
        actions: [
            { action: 'accept-friend', title: 'ACEPTAR' },
            { action: 'reject-friend', title: 'RECHAZAR' }
        ],
        data: {
            requesterId: data.requesterId
        }
    });
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
