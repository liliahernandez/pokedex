<script setup>
import { onMounted, onUnmounted } from 'vue';
import * as socketService from '../services/socket';
import { notificationService } from '../services/notifications';

const handleBattleRequest = (data) => {
    // ONLY native notification as requested
    notificationService.show('Desafío de Batalla ⚔️', {
        body: `${data.challengerName || data.challengerEmail} te ha desafiado.`,
        tag: 'battle-request',
        renotify: true,
        vibrate: [200, 100, 200, 100, 200],
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
  <!-- No in-app UI, using native system notifications only as requested -->
</template>

<style scoped>
</style>
