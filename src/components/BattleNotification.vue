<script setup>
import { onMounted, onUnmounted } from 'vue';
import * as socketService from '../services/socket';
import { notificationService } from '../services/notifications';

const handleBattleRequest = (data) => {
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
};

onMounted(() => {
    socketService.on('battle_request', handleBattleRequest);
});

onUnmounted(() => {
    socketService.off('battle_request', handleBattleRequest);
});
</script>

<template>
  <!-- No in-app UI for battle notifications, using native system notifications only -->
</template>

<style scoped>
</style>
