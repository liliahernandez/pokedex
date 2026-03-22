<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getSocket } from '../services/socket';
import { useUserStore } from '../stores/user';
import { notificationService } from '../services/notifications';

const showing = ref(false);
const requestData = ref(null);
const userStore = useUserStore();
const error = ref('');

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
            requestData.value = data;

            // Only show internal box if native is not allowed
            if (Notification.permission !== 'granted') {
                showing.value = true;
            }

            // Show native notification
            notificationService.show('¡Solicitud de Amistad! 🤝', {
                body: `${data.requesterName || data.requesterEmail} quiere ser tu amigo.`,
                tag: 'friend-request'
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

const acceptRequest = async () => {
    try {
        await userStore.acceptFriendRequest(requestData.value.requesterId);
        showing.value = false;
        alert(`¡Ahora eres amigo de ${requestData.value.requesterName || requestData.value.requesterEmail}!`);
    } catch(err) {
        error.value = err;
        setTimeout(() => {
            showing.value = false;
            error.value = '';
        }, 2000);
    }
};

const rejectRequest = () => {
    showing.value = false;
    requestData.value = null;
};
</script>

<template>
    <div v-if="showing" class="notification-overlay">
        <div class="notification-card glass-panel">
            <h3>¡Solicitud de Amistad!</h3>
            <p>
                <strong>{{ requestData.requesterName || requestData.requesterEmail }}</strong> 
                <br/>
                <small>(Código: {{ requestData.requesterFriendCode }})</small>
                <br/>
                Quiere ser tu amigo.
            </p>
            <p v-if="error" class="error">{{ error }}</p>
            <div class="actions">
                <button class="btn success" @click="acceptRequest">Aceptar</button>
                <button class="btn danger" @click="rejectRequest">Rechazar</button>
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
    border-left: 5px solid #4ade80; /* Green */
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    background: rgba(30,30,40,0.95);
    color: white;
}

h3 {
    margin-top: 0;
    color: #4ade80;
    margin-bottom: 0.5rem;
}

p {
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
    line-height: 1.4;
}

.error {
    color: #ef4444;
    margin-bottom: 0.5rem;
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
