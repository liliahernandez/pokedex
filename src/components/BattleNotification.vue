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
            registeredSocket.off('battle_request');
        }
        registeredSocket = socket;
        
        socket.on('battle_request', (data) => {
            // Show native notification with actions
            notificationService.show('¡Desafío de Batalla! ⚔️', {
                body: `${data.challengerName || data.challengerEmail} te ha desafiado a una batalla.`,
                tag: 'battle-request',
                actions: [
                    { action: 'accept-battle', title: 'ACEPTAR' },
                    { action: 'reject-battle', title: 'RECHAZAR' }
                ],
                data: {
                    battleId: data.battleId,
                    challengerId: data.challengerId
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
        registeredSocket.off('battle_request');
    }
});
</script>

<template>
  <!-- No in-app UI for battle notifications, using native system notifications only -->
</template>

<style scoped>
</style>
