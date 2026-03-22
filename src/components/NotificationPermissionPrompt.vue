<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { notificationService } from '../services/notifications';

const authStore = useAuthStore();
const showing = ref(false);

const checkPermissionStatus = () => {
    if (!authStore.isAuthenticated) return;
    
    // Only show if not yet granted or denied
    if (Notification.permission === 'default') {
        showing.value = true;
    }
};

onMounted(() => {
    // Check shortly after mount to ensure Auth store is ready
    setTimeout(checkPermissionStatus, 2000);
});

const handleAllow = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
        // Test notification
        notificationService.show('¡Notificaciones Activadas! 🔔', {
            body: 'Ahora recibirás desafíos y solicitudes aquí.',
            tag: 'permission-test'
        });
    }
    showing.value = false;
};

const handleDismiss = () => {
    showing.value = false;
};
</script>

<template>
    <div v-if="showing && authStore.isAuthenticated" class="permission-prompt glass-panel">
        <div class="content">
            <span class="icon">🔔</span>
            <div class="text">
                <h3>Activar Notificaciones</h3>
                <p>Para recibir desafíos y solicitudes como en tu celular, necesitamos tu permiso.</p>
            </div>
        </div>
        <div class="actions">
            <button class="btn secondary" @click="handleDismiss">Luego</button>
            <button class="btn success" @click="handleAllow">ACTIVAR</button>
        </div>
    </div>
</template>

<style scoped>
.permission-prompt {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    z-index: 10000;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@media (min-width: 640px) {
    .permission-prompt {
        left: auto;
        width: 400px;
        bottom: 30px;
        right: 30px;
    }
}

@keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.content {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.icon {
    font-size: 2rem;
}

.text h3 {
    margin: 0;
    color: #ffcb05;
    font-size: 1.1rem;
}

.text p {
    margin: 0.2rem 0 0;
    font-size: 0.9rem;
    color: #cbd5e1;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
}

.btn {
    padding: 0.6rem 1.2rem;
    font-weight: bold;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
}

.success {
    background: #ffcb05;
    color: #1e293b;
}

.secondary {
    background: transparent;
    color: #94a3b8;
    border: 1px solid #475569;
}
</style>
