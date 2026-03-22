<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getSocket } from '../services/socket';
import { useRouter } from 'vue-router';
import { notificationService } from '../services/notifications';

const router = useRouter();
const showing = ref(false);
const challengeData = ref(null);

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
            challengeData.value = data;
            showing.value = true;
            
            // Show native notification
            notificationService.show('¡Desafío de Batalla! ⚔️', {
                body: `${data.challengerName || data.challengerEmail} te ha desafiado a una batalla.`,
                tag: 'battle-request'
            });
        });
    }
};

onMounted(() => {
    // Retry to grab the socket instance just in case it takes a moment to initialize
    socketInterval = setInterval(setupSocketListener, 500);
});

onUnmounted(() => {
    clearInterval(socketInterval);
    if (registeredSocket) {
        registeredSocket.off('battle_request');
    }
});

const acceptChallenge = () => {
    showing.value = false;
    // Redirect to battle view if implemented, or just dismiss
    // router.push(`/battle/${challengeData.value.battleId}`);
    alert('Desafío aceptado. (El sistema de batalla activo no está implementado en la UI actual)');
};

const rejectChallenge = () => {
    showing.value = false;
    challengeData.value = null;
};
</script>

<template>
    <div v-if="showing" class="notification-overlay">
        <div class="notification-card glass-panel">
            <h3>¡Desafío de Batalla!</h3>
            <p>
                <strong>{{ challengeData.challengerEmail }}</strong> 
                (Código: {{ challengeData.challengerFriendCode }}) 
                te ha desafiado a una batalla.
            </p>
            <div class="actions">
                <button class="btn success" @click="acceptChallenge">Aceptar</button>
                <button class="btn danger" @click="rejectChallenge">Rechazar</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.notification-overlay {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification-card {
    padding: 1.5rem;
    width: 300px;
    border-left: 5px solid #ffcb05; /* Pokemon Yellow */
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    background: rgba(30,30,40,0.95);
    color: white;
}

h3 {
    margin-top: 0;
    color: #ffcb05;
    margin-bottom: 0.5rem;
}

p {
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
    line-height: 1.4;
}

.actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
}

.success {
    background: #4ade80;
    color: #1a202c;
    border-color: #22c55e;
}

.danger {
    background: transparent;
    border-color: #ef4444;
    color: #ef4444;
}

.danger:hover {
    background: rgba(239, 68, 68, 0.1);
}
</style>
