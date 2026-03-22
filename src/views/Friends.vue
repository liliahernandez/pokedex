<script setup>
import { onMounted, ref } from 'vue';
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

onMounted(() => {
    userStore.fetchFriends();
    userStore.fetchTeams();
    
    // Check socket
    const interval = setInterval(() => {
        const socket = userStore.getSocket?.() || null;
        if (socket?.connected) {
            socketStatus.value = 'Conectado ✅';
            clearInterval(interval);
        }
    }, 1000);
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
        error.value = err;
    }
};

const removeFriend = async (friendId) => {
    if (!confirm('¿Seguro que deseas eliminar a este amigo?')) return;
    try {
        await userStore.removeFriend(friendId);
    } catch(err) {
        alert(err);
    }
};

const openChallengeModal = (friendId) => {
    selectedFriendId.value = friendId;
    selectedTeamId.value = '';
    error.value = '';
    challengeSuccess.value = '';
    showTeamModal.value = true;
};

const sendChallenge = async () => {
    if (!selectedTeamId.value) {
        error.value = 'Debes seleccionar un equipo';
        return;
    }
    
    try {
        await userStore.createBattle(selectedFriendId.value, selectedTeamId.value);
        
        challengeSuccess.value = '¡Desafío enviado!';
        setTimeout(() => {
            showTeamModal.value = false;
            challengeSuccess.value = '';
        }, 1500);
    } catch (err) {
        error.value = typeof err === 'string' ? err : err.message || 'Error al enviar desafío';
    }
};

const copyCode = () => {
    if (authStore.user?.friendCode) {
        navigator.clipboard.writeText(authStore.user.friendCode);
        alert('¡Código copiado!');
    }
};
</script>

<template>
    <div class="friends-container">
        <div class="profile-section glass-panel">
            <h2>Perfil de {{ authStore.user?.name || authStore.user?.email.split('@')[0] }}</h2>
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
            <p v-if="challengeSuccess && !showTeamModal" class="success">{{ challengeSuccess }}</p>
        </div>

        <div class="friends-list glass-panel">
            <h3>Mis Amigos</h3>
            <div v-if="userStore.friends.length === 0">Aún no tienes amigos. ¡Comparte tu código!</div>
            <ul v-else>
                <li v-for="friend in userStore.friends" :key="friend._id || friend.id" class="friend-item">
                    <div class="friend-info">
                        <strong>{{ friend.name || friend.email }}</strong>
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
        <!-- Debug Info (for development) -->
        <div class="debug-panel glass-panel" style="margin-top: 2rem; font-size: 0.7rem; opacity: 0.5;">
            <p>Backend: {{ apiUrl }}</p>
            <p>Socket: {{ socketStatus }}</p>
            <p>Usuario: {{ authStore.user?.email }}</p>
        </div>
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
</style>
