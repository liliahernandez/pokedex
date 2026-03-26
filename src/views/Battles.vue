<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const battles = ref([]);
const loading = ref(true);
const error = ref('');

const fetchHistory = async () => {
    try {
        const response = await api.get('/battles');
        battles.value = response.data.battles || [];
    } catch (err) {
        error.value = 'Error al cargar el historial de batallas.';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchHistory();
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const deleteBattle = async (battleId) => {
    if (!confirm('¿Seguro que deseas eliminar esta batalla del historial?')) return;
    
    try {
        await api.delete(`/battles/${battleId}`);
        battles.value = battles.value.filter(b => b._id !== battleId);
    } catch (err) {
        alert('Error al eliminar la batalla');
        console.error(err);
    }
};

const getWinnerName = (battle) => {
    if (!battle.winnerId) return 'Empate';
    if (battle.winner) return battle.winner.nickname || battle.winner.name || battle.winner.email;
    
    const wId = battle.winnerId.toString();
    if (wId === battle.challengerId?.toString() || wId === battle.challenger?._id?.toString()) {
        const name = battle.challenger?.name || 'Retador';
        return battle.challenger?.nickname ? `${name} (${battle.challenger.nickname})` : name;
    }
    if (wId === battle.opponentId?.toString() || wId === battle.opponent?._id?.toString()) {
        const name = battle.opponent?.name || 'Rival';
        return battle.opponent?.nickname ? `${name} (${battle.opponent.nickname})` : name;
    }
    return 'Desconocido';
};
</script>

<template>
    <div class="battles-history glass-panel">
        <h2 class="title">Historial de Batallas</h2>
        
        <div v-if="loading" class="loading">Cargando combates...</div>
        <div v-else-if="error" class="error-msg">{{ error }}</div>
        <div v-else-if="battles.length === 0" class="empty">No has participado en ninguna batalla aún.</div>
        
        <div v-else class="battles-list">
            <div v-for="battle in battles" :key="battle._id" class="battle-card">
                <div class="battle-header">
                    <span class="battle-date">{{ formatDate(battle.createdAt) }}</span>
                    <span class="battle-status" :class="battle.status">
                        {{ battle.status === 'completed' ? 'Completado' : (battle.status === 'active' ? 'En Curso' : 'Pendiente') }}
                    </span>
                </div>
                
                <div class="battle-players">
                    <div class="player" :class="{'winner': battle.winnerId === battle.challengerId, 'loser': battle.winnerId && battle.winnerId !== battle.challengerId}">
                        <strong>{{ battle.challenger?.name || 'Retador' }}</strong>
                        <span v-if="battle.challenger?.nickname" class="h-nickname">({{ battle.challenger.nickname }})</span>
                        <span class="role">Retador</span>
                    </div>
                    
                    <div class="vs">VS</div>
                    
                    <div class="player" :class="{'winner': battle.winnerId === battle.opponentId, 'loser': battle.winnerId && battle.winnerId !== battle.opponentId}">
                        <strong>{{ battle.opponent?.name || 'Oponente' }}</strong>
                        <span v-if="battle.opponent?.nickname" class="h-nickname">({{ battle.opponent.nickname }})</span>
                        <span class="role">Oponente</span>
                    </div>
                </div>
                
                <div class="battle-footer" v-if="battle.status === 'completed'">
                    <div class="winner-badge">
                        🏆 Ganador: <strong>{{ getWinnerName(battle) }}</strong>
                    </div>
                    <button class="btn delete-btn" @click.stop="deleteBattle(battle._id)">Eliminar</button>
                </div>
                <div class="battle-footer" v-else-if="battle.status === 'active'">
                    <button class="btn small primary" @click="router.push(`/battle/${battle._id}`)">Reconectar</button>
                    <button class="btn small delete-btn ml-2" @click.stop="deleteBattle(battle._id)">Eliminar</button>
                </div>
                <div class="battle-footer" v-else-if="battle.status === 'pending'">
                    <span class="status-msg">Esperando a que ambos jugadores se unan...</span>
                    <button class="btn small delete-btn ml-2" @click.stop="deleteBattle(battle._id)">Cancelar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.battles-history {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 16px;
    background: rgba(30, 41, 59, 0.95);
    color: white;
}

.title {
    font-size: 2rem;
    margin-bottom: 2rem;
    text-align: center;
    color: #f8fafc;
    border-bottom: 2px solid #334155;
    padding-bottom: 1rem;
}

.loading, .empty {
    text-align: center;
    color: #94a3b8;
    padding: 2rem;
    font-size: 1.2rem;
}

.error-msg {
    color: #ef4444;
    text-align: center;
    padding: 1rem;
}

.battles-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.battle-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    transition: transform 0.2s;
}

.battle-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
}

.battle-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    color: #94a3b8;
}

.battle-status {
    padding: 0.2rem 0.8rem;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.8rem;
}

.battle-status.completed { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.battle-status.active { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
.battle-status.pending { background: rgba(250, 204, 21, 0.2); color: #facc15; }

.battle-players {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    margin-bottom: 1.5rem;
}

.player {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.player strong {
    font-size: 1.2rem;
    color: #f8fafc;
}

.player.winner strong {
    color: #facc15;
}

.player.loser strong {
    color: #94a3b8;
    text-decoration: line-through;
}

.h-nickname {
    font-size: 0.8rem;
    color: var(--primary-color);
    font-style: italic;
}

.role {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 0.3rem;
}

.vs {
    font-size: 1.5rem;
    font-weight: 900;
    color: #ef4444;
    font-style: italic;
    padding: 0 1rem;
}

.battle-footer {
    display: flex;
    justify-content: center;
}

.winner-badge {
    background: rgba(250, 204, 21, 0.1);
    border: 1px solid rgba(250, 204, 21, 0.3);
    color: #fde047;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    font-size: 1.1rem;
    margin-right: 1rem;
}

.delete-btn {
    background: transparent;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 0.3rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
}

.ml-2 {
    margin-left: 0.5rem;
}

.status-msg {
    color: #94a3b8;
    font-size: 0.9rem;
    font-style: italic;
    margin-right: 1rem;
}
</style>
