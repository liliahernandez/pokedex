<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBattleStore } from '../stores/battle';

const route = useRoute();
const router = useRouter();
const battleStore = useBattleStore();

const currentVisualLog = ref('');
const showEndScreen = ref(false);

const battleId = route.params.id;

// We process the logs sequentially
const processLogsQueue = () => {
    if (battleStore.turnLogs.length > 0 && !currentVisualLog.value) {
        const nextLog = battleStore.turnLogs[0];
        currentVisualLog.value = nextLog.message;
        
        // Show message for 2.5 seconds then clear
        setTimeout(() => {
            currentVisualLog.value = '';
            battleStore.clearNextLog();
            processLogsQueue();
            checkBattleEnd();
        }, 3000);
    }
};

// Watch for array changes to trigger processing if idle
watch(() => battleStore.turnLogs.length, (newLen, oldLen) => {
    if (newLen > oldLen) {
        // If we were waiting for the opponent, clear it to allow logs to play!
        if (currentVisualLog.value === "Esperando al rival...") {
            currentVisualLog.value = '';
        }
        processLogsQueue();
    }
});

const checkBattleEnd = () => {
    if (battleStore.currentBattle?.status === 'completed' && battleStore.turnLogs.length === 0) {
        showEndScreen.value = true;
    }
};

onMounted(async () => {
    await battleStore.fetchBattle(battleId);
    if (!battleStore.error) {
        battleStore.joinBattleRoom(battleId);
        checkBattleEnd();
    }
});

onUnmounted(() => {
    msgTimer && clearTimeout(msgTimer);
    battleStore.leaveBattleRoom(battleId);
});

const selectMove = (moveName) => {
    if (battleStore.hasSelectedMove) return;
    battleStore.selectMove(battleId, moveName);
    currentVisualLog.value = "Esperando al rival...";
    // We don't clear this with a timeout. It stays until the turn resolves!
};

// Computed Helpers for HP Bars
const myHpPercent = computed(() => {
    const p = battleStore.activeMyPokemon;
    if (!p) return 0;
    const max = p.stats?.hp || 100;
    return Math.max(0, Math.min(100, (p.currentHp / max) * 100));
});

const opHpPercent = computed(() => {
    const p = battleStore.activeOpponentPokemon;
    if (!p) return 0;
    const max = p.stats?.hp || 100;
    return Math.max(0, Math.min(100, (p.currentHp / max) * 100));
});

const hpColor = (pct) => {
    if (pct > 50) return '#4ade80'; // Green
    if (pct > 20) return '#facc15'; // Yellow
    return '#ef4444'; // Red
};

const winnerName = computed(() => {
    const battle = battleStore.currentBattle;
    if (!battle || !battle.winnerId) return 'Empate';
    if (battle.winner) return battle.winner.name || battle.winner.email;
    
    // Fallbacks if winner object is not populated
    const wId = battle.winnerId.toString();
    if (wId === battle.challengerId?.toString() || wId === battle.challenger?._id?.toString()) {
        return battle.challenger?.name || 'Tú (Retador)';
    }
    if (wId === battle.opponentId?.toString() || wId === battle.opponent?._id?.toString()) {
        return battle.opponent?.name || 'El Rival';
    }
    return 'Desconocido';
});

</script>

<template>
    <div class="battle-arena">
        <div v-if="battleStore.loading" class="loading">Cargando combate...</div>
        <div v-else-if="battleStore.error" class="error">{{ battleStore.error }}</div>
        
        <template v-else-if="battleStore.currentBattle">
            
            <!-- OPPONENT SIDE (Top) -->
            <div class="opponent-side" v-if="battleStore.activeOpponentPokemon">
                <div class="hud glass-panel">
                    <div class="hud-top">
                        <strong>{{ battleStore.activeOpponentPokemon?.name?.toUpperCase() }}</strong>
                        <span>Lv50</span>
                    </div>
                    
                    <div class="team-roster">
                        <div v-for="(p, idx) in battleStore.opponentTeam" :key="idx" class="mini-sprite" :class="{'fainted-mini': p.currentHp <= 0, 'active-mini': idx === battleStore.currentBattle.activePokemonOpponent}">
                            <img :src="p.sprite" />
                        </div>
                    </div>
                    <div class="hp-border">
                        <div class="hp-bar" :style="{ width: opHpPercent + '%', backgroundColor: hpColor(opHpPercent) }"></div>
                    </div>
                </div>
                <!-- Sprite (Static relative to HUD) -->
                <div class="sprite op-sprite">
                    <img :src="battleStore.activeOpponentPokemon.sprite" :class="{ 'fainted': battleStore.activeOpponentPokemon.currentHp <= 0 }"/>
                </div>
            </div>

            <!-- PLAYER SIDE (Bottom) -->
            <div class="player-side" v-if="battleStore.activeMyPokemon">
                <!-- We flip player's sprite via CSS -->
                <div class="sprite my-sprite">
                    <img :src="battleStore.activeMyPokemon.sprite" :class="{ 'fainted': battleStore.activeMyPokemon.currentHp <= 0 }" />
                </div>
                <div class="hud glass-panel">
                    <div class="hud-top">
                        <strong>{{ battleStore.activeMyPokemon?.name?.toUpperCase() }}</strong>
                        <span>Lv50</span>
                    </div>

                    <div class="team-roster">
                        <div v-for="(p, idx) in battleStore.myTeam" :key="idx" class="mini-sprite" :class="{'fainted-mini': p.currentHp <= 0, 'active-mini': (battleStore.isChallenger ? battleStore.currentBattle.activePokemonChallenger : battleStore.currentBattle.activePokemonOpponent) === idx}">
                            <img :src="p.sprite" />
                        </div>
                    </div>
                    <div class="hp-border">
                        <div class="hp-bar" :style="{ width: myHpPercent + '%', backgroundColor: hpColor(myHpPercent) }"></div>
                    </div>
                    <div class="hp-numbers">
                        {{ Math.max(0, battleStore.activeMyPokemon.currentHp) }} / {{ battleStore.activeMyPokemon.stats?.hp || 100 }}
                    </div>
                </div>
            </div>

            <!-- BATTLE MENU / TEXT BOX -->
            <div class="battle-menu glass-panel">
                <div v-if="showEndScreen" class="end-screen">
                    <h2 style="color: #1d4ed8; text-shadow: 1px 1px 0px white;">¡Batalla Completada!</h2>
                    <div class="battle-history-tag">
                        Historial Oficial: <span>{{ battleStore.currentBattle.challenger?.name || 'Retador' }}</span>  vs  <span>{{ battleStore.currentBattle.opponent?.name || 'Oponente' }}</span>
                    </div>
                    <p class="winner-tag">🏆 Ganador: <strong>{{ winnerName }}</strong></p>
                    <button class="btn challenge-btn" @click="router.push('/friends')">Volver a Amigos</button>
                </div>
                
                <div v-else-if="currentVisualLog" class="text-box">
                    <p>{{ currentVisualLog }}</p>
                </div>

                <div v-else-if="!battleStore.hasSelectedMove && battleStore.currentBattle.status !== 'completed'" class="action-box">
                    <p>¿Qué debe hacer {{ battleStore.activeMyPokemon?.name?.toUpperCase() }}?</p>
                    <div class="moves-grid">
                        <button 
                            v-for="(move, i) in battleStore.activeMyPokemon?.moves" 
                            :key="i"
                            class="btn move-btn"
                            @click="selectMove(move)"
                        >
                            {{ move }}
                        </button>
                    </div>
                </div>
                
                <div v-else class="text-box">
                    <p>Esperando el siguiente turno...</p>
                </div>
            </div>

        </template>
    </div>
</template>

<style scoped>
.battle-arena {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: calc(100vh - 80px); /* Fits under navbar */
    max-height: 800px;
    background: linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%);
    border-radius: var(--radius-lg);
    overflow: hidden;
    position: relative;
    padding: 1rem;
    color: #1a202c; /* Classic dark text on bright sky BG */
}

/* Common HUD styling */
.hud {
    background: rgba(255, 255, 255, 0.9) !important;
    border: 3px solid #334155;
    border-radius: 8px 0 8px 0;
    padding: 0.5rem 1rem;
    width: 200px;
    z-index: 10;
}

.hud-top {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 5px;
    font-weight: 900;
}

.hp-border {
    width: 100%;
    height: 10px;
    background: #475569;
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid #1e293b;
}

.hp-bar {
    height: 100%;
    transition: width 0.5s ease-out, background-color 0.5s;
}

.hp-numbers {
    text-align: right;
    font-size: 0.8rem;
    font-weight: bold;
    margin-top: 3px;
}

/* Layout logic */
.opponent-side {
    display: flex;
    justify-content: flex-start;
    align-items: center; /* keep sprite near hud */
    gap: 1rem;
    padding-top: 1rem;
}

.op-sprite img {
    width: 120px;
    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));
    transition: opacity 0.3s;
}

.player-side {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    padding-bottom: 2rem;
}

.my-sprite img {
    width: 160px;
    transform: scaleX(-1); /* Flips front sprite to back conceptually */
    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));
    transition: opacity 0.3s;
}

.fainted {
    opacity: 0;
    transform: translateY(50px) scaleX(-1) !important; /* drop effect */
    transition: all 1s ease-in;
}
.op-sprite .fainted {
    transform: translateY(50px) scaleX(1) !important;
}

/* Bottom Menu */
.battle-menu {
    border: 4px solid #334155 !important;
    background: #ffffff !important;
    border-radius: 12px;
    min-height: 120px;
    padding: 1rem;
    color: #1e293b;
    font-family: monospace;
    font-size: 1.1rem;
    font-weight: bold;
    display: flex;
    align-items: center;
}

.action-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.action-box p {
    margin: 0 0 0.5rem 0;
}

.moves-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.move-btn {
    background: #f8fafc;
    color: #1e293b;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.5rem;
    text-transform: capitalize;
    font-weight: bold;
    font-family: inherit;
    transition: all 0.2s;
}

.move-btn:hover {
    background: #cbd5e1;
}

.text-box p {
    margin: 0;
    font-size: 1.2rem;
}

.end-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 1rem;
}

.battle-history-tag {
    background: #f1f5f9;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px dotted #cbd5e1;
    font-size: 1.1rem;
}

.battle-history-tag span {
    font-weight: 800;
    color: #475569;
}

.winner-tag {
    font-size: 1.5rem !important;
    background: #fef08a;
    padding: 0.5rem 2rem;
    border-radius: 12px;
    border: 2px solid #eab308;
    color: #854d0e;
}

/* Roster Mini Sprites */
.team-roster {
    display: flex;
    gap: 4px;
    margin-bottom: 5px;
    justify-content: flex-end;
}

.mini-sprite {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.2);
}

.mini-sprite img {
    width: 140%;
}

.fainted-mini {
    opacity: 0.3;
    filter: grayscale(100%);
    background: #ef4444;
}

.active-mini {
    border-color: #22c55e;
    box-shadow: 0 0 5px #22c55e;
    background: rgba(34, 197, 94, 0.2);
}

@media (max-width: 600px) {
    .hud { width: 160px; }
    .my-sprite img { width: 100px; }
    .op-sprite img { width: 80px; }
    .battle-menu { font-size: 0.9rem; padding: 0.5rem; }
    .moves-grid { grid-template-columns: 1fr; }
    
    .opponent-side, .player-side {
        gap: 0.5rem;
    }
}
</style>
