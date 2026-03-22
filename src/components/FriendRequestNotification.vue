<script setup>
import { onMounted, onUnmounted } from 'vue';
import { getSocket } from '../services/socket';
import { notificationService } from '../services/notifications';

let socketInterval;
let registeredSocket = null;

const setupSocketListener = () => {
    const socket = getSocket();
    if (socket && socket !== registeredSocket) {
        if (registeredSocket) {
            registeredSocket.off('friend_request');
        }
        registeredSocket = socket;

        socket.on('friend_request', (data) => {
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
        });
    }
};

onMounted(() => {
    socketInterval = setInterval(setupSocketListener, 500);
});

onUnmounted(() => {
    clearInterval(socketInterval);
    if (registeredSocket) {
        registeredSocket.off('friend_request');
    }
});
</script>

<template>
  <!-- No in-app UI for friend notifications, using native system notifications only -->
</template>

<style scoped>
</style>
