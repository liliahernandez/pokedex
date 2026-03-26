<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useUserStore } from '../stores/user';
import { useAuthStore } from '../stores/auth';

const userStore = useUserStore();
const authStore = useAuthStore();
const friendCodeInput = ref('');
const error = ref('');

const showTeamModal = ref(false);
const selectedFriendId = ref(null); // Used if challenging from list
const selectedTeamId = ref('');
const challengeSuccess = ref('');

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const socketStatus = ref('Desconectado');
const successMessage = ref('');

const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
        console.log('[Friends] App focused, auto-refreshing...');
        userStore.fetchFriends();
        userStore.fetchPendingRequests();
    }
};

onMounted(() => {
    userStore.fetchFriends();
    userStore.fetchPendingRequests();
    userStore.listenForFriendEvents();
    
    // Listen for real-time friend additions to show a message
    const syncChannel = new BroadcastChannel('pokedex-sync');
    syncChannel.onmessage = (event) => {
        if (event.data?.type === 'NOTIFICATION_ACTION' && event.data.action === 'accept-friend') {
            successMessage.value = '¡Amistad aceptada! Actualizando...';
            setTimeout(() => successMessage.value = '', 3000);
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});

const sendFriendRequest = async () => {
    if (!friendCodeInput.value) return;
    error.value = '';
    
    // Check if it's our own code
    if (friendCodeInput.value === authStore.user?.friendCode) {
        error.value = 'No puedes añadirte a ti mismo';
        return;
    }

    try {
        const res = await userStore.sendFriendRequest(friendCodeInput.value);
        friendCodeInput.value = '';
        challengeSuccess.value = res.message || 'Solicitud enviada';
        setTimeout(() => challengeSuccess.value = '', 3000);
    } catch (err) {
        if (err.isOfflineSync) return;
        error.value = err;
    }
};

const removeFriend = async (friendId) => {
    if (!confirm('¿Seguro que deseas eliminar a este amigo?')) return;
    try {
        await userStore.removeFriend(friendId);
        successMessage.value = 'Amigo eliminado exitosamente';
        setTimeout(() => successMessage.value = '', 3000);
    } catch(err) {
        if (err.isOfflineSync) return;
        alert(err);
    }
};

const acceptPending = async (friendId) => {
    try {
        await userStore.acceptFriendRequest(friendId);
        challengeSuccess.value = '¡Solicitud aceptada!';
        userStore.fetchPendingRequests();
        setTimeout(() => challengeSuccess.value = '', 3000);
    } catch (err) {
        if (err.isOfflineSync) return;
        error.value = err;
    }
};

const openChallengeModal = async (friendId) => {
    selectedFriendId.value = friendId;
    selectedTeamId.value = '';
    error.value = '';
    challengeSuccess.value = '';
    
    // Ensure teams are loaded before showing them
    await userStore.fetchTeams();
    
    showTeamModal.value = true;
};

const sendChallenge = async () => {
    if (!selectedTeamId.value) {
        error.value = 'Debes seleccionar un equipo';
        return;
    }
    
    try {
        const res = await userStore.createBattle(selectedFriendId.value, selectedTeamId.value);
        showTeamModal.value = false;
        
        // Redirigir directamente al coliseo de batalla
        if (res && res.battleId) {
            import('vue-router').then(({ useRouter }) => {
                 // In script setup top level this is safer, or we use window.location
                 window.location.href = `/battle/${res.battleId}`;
            });
        }

    } catch (err) {
        if (err.isOfflineSync) return;
        error.value = typeof err === 'string' ? err : err.message || 'Error al enviar desafío';
    }
};

const copyCode = () => {
    if (authStore.user?.friendCode) {
        navigator.clipboard.writeText(authStore.user.friendCode);
        alert('¡Código copiado!');
    }
};

const resetPWA = async () => {
    if (!confirm('¿Estás seguro? Esto borrará el caché del móvil y reiniciará la App para forzar la actualización.')) return;
    try {
        // 1. Unregister all SW
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) await reg.unregister();
        
        // 2. Clear IDB
        const DB_NAME = 'offline-store';
        indexedDB.deleteDatabase(DB_NAME);
        
        // 3. Clear Cache
        const keys = await caches.keys();
        for (let key of keys) await caches.delete(key);
        
        alert('Limpieza completada. Reiniciando...');
        window.location.reload(true);
    } catch (e) {
        alert('Error al reiniciar: ' + e.message);
    }
};
</script>

<template>
    <div class="friends-container">
        <div v-if="successMessage" class="success-toast">
            {{ successMessage }}
        </div>

        <div class="profile-section glass-panel">
            <div class="profile-header">
                <h2>{{ authStore.user?.name }}</h2>
                <h3 v-if="authStore.user?.nickname" class="nickname-sub">({{ authStore.user.nickname }})</h3>
            </div>
            <div class="code-display">
                <span>Código de Amigo:</span>
                <strong @click="copyCode" class="code">{{ authStore.user?.friendCode }}</strong>
                <small>(Haz clic para copiar)</small>
            </div>
        </div>

        <div class="add-friend glass-panel">
            <h3>Añadir Amigo</h3>
            <div class="input-group">
                <input v-model="friendCodeInput" placeholder="Ingresa Código de Amigo" />
                <button class="btn" @click="sendFriendRequest">Enviar Solicitud</button>
            </div>
            <p v-if="error" class="error">{{ error }}</p>
            <p v-if="challengeSuccess && !showTeamModal && !userStore.pendingRequests.length" class="success">{{ challengeSuccess }}</p>
        </div>

        <!-- Solicitudes Pendientes removed as per user request -->

        <div class="friends-list glass-panel">
            <h3>Mis Amigos</h3>
            <div v-if="userStore.friends.length === 0">Aún no tienes amigos. ¡Comparte tu código!</div>
            <ul v-else>
                <li v-for="friend in userStore.friends" :key="friend._id || friend.id" class="friend-item">
                    <div class="friend-info">
                        <div class="name-box">
                            <strong class="f-name">{{ friend.name || friend.email }}</strong>
                            <span v-if="friend.nickname" class="f-nickname">({{ friend.nickname }})</span>
                        </div>
                    </div>
                    <div class="friend-actions">
                        <button class="btn battle-btn" @click="openChallengeModal(friend._id || friend.id)">¡Desafiar!</button>
                        <button class="btn delete-btn" @click="removeFriend(friend._id || friend.id)" title="Eliminar Amigo">🗑️</button>
                    </div>
                </li>
            </ul>
        </div>

        <!-- Team Selection Modal -->
        <div v-if="showTeamModal" class="modal-overlay" @click.self="showTeamModal = false">
            <div class="modal-card glass-panel">
                <h3>Selecciona tu equipo para la batalla</h3>
                
                <div v-if="userStore.teams.length === 0" class="no-teams">
                    <p>No tienes equipos creados. ¡Crea uno primero!</p>
                    <button class="btn" @click="$router.push('/teams')">Ir a Equipos</button>
                </div>
                
                <div v-else class="team-selection">
                    <select v-model="selectedTeamId" class="team-select">
                        <option value="" disabled>-- Elige un equipo --</option>
                        <option v-for="team in userStore.teams" :key="team.id || team._id" :value="team.id || team._id">
                            {{ team.name }} ({{ team.pokemon?.length || 0 }} Pokémon)
                        </option>
                    </select>
                    
                    <p v-if="error" class="error">{{ error }}</p>
                    <p v-if="challengeSuccess" class="success">{{ challengeSuccess }}</p>
                    
                    <div class="modal-actions">
                        <button class="btn secondary" @click="showTeamModal = false">Cancelar</button>
                        <button class="btn challenge-btn" @click="sendChallenge" :disabled="!selectedTeamId">Entrar al Combate</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Diagnostic panel removed as per user request -->
    </div>
</template>

<style scoped>
.friends-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.profile-section, .add-friend, .friends-list {
    padding: 1.5rem;
}

.code-display {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.2rem;
    margin-top: 1rem;
}

.code {
    background: rgba(255,255,255,0.1);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    color: var(--primary-color);
}

.input-group {
    display: flex;
    gap: 1rem;
}

.friend-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--glass-border);
}

.battle-btn {
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    background: linear-gradient(135deg, #ff4d4d, #f9cb28);
}

.friend-info {
    display: flex;
    flex-direction: column;
}

.friend-name {
    color: #a0aec0;
    font-size: 0.8rem;
}

.friend-actions {
    display: flex;
    gap: 0.5rem;
}

.profile-header h2 {
    margin: 0;
    font-size: 1.8rem;
}

.nickname-sub {
    margin: 0 0 1rem 0;
    color: var(--primary-color);
    font-style: italic;
    font-size: 1.1rem;
}

.name-box {
    display: flex;
    flex-direction: column;
}

.f-name {
    font-size: 1.1rem;
}

.f-nickname {
    font-size: 0.85rem;
    color: var(--primary-color);
    font-style: italic;
}

.delete-btn {
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    background: transparent;
    border: 1px solid #ef4444;
}

.delete-btn:hover {
    background: rgba(239, 68, 68, 0.2);
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-card {
    padding: 2rem;
    width: 90%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: #1e1e28;
}

.team-select {
    width: 100%;
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 1rem;
}

.team-select option {
    background: #1e1e28;
    color: white;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
}

.challenge-btn {
    background: #ff4d4d;
}

.challenge-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.success {
    color: #4ade80;
    margin-top: 0.5rem;
}

.error {
    color: #ef4444;
    margin-top: 0.5rem;
}
.success-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4ade80;
    color: #1a202c;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

/* Mobile Responsive */
@media (max-width: 600px) {
    .input-group {
        flex-direction: column;
    }
    .friend-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    .friend-actions {
        width: 100%;
        justify-content: flex-end;
    }
    .code-display {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
