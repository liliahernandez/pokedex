<script setup>
import { onMounted, onUnmounted } from 'vue';
import * as socketService from '../services/socket';
import { notificationService } from '../services/notifications';

const handleFriendRequest = (data) => {
    // Show native notification with actions
    notificationService.show('¡Solicitud de Amistad! 🤝', {
        body: `${data.requesterName || data.requesterEmail} quiere ser tu amigo.`,
        tag: 'friend-request',
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
  <!-- No in-app UI for friend notifications, using native system notifications only -->
</template>

<style scoped>
</style>
