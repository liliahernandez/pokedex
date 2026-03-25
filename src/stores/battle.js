import { defineStore } from 'pinia';
import api from '../services/api';
import * as socketService from '../services/socket';
import { useAuthStore } from './auth';

export const useBattleStore = defineStore('battle', {
    state: () => ({
        currentBattle: null,
        loading: false,
        error: null,
        hasSelectedMove: false,
        turnLogs: [], // queue of newly arrived logs to process visually
        battleRoomJoined: false
    }),
    
    getters: {
        isChallenger: (state) => {
            const authStore = useAuthStore();
            if (!state.currentBattle || !authStore.user) return false;
            return state.currentBattle.challengerId === authStore.user.id;
        },
        myTeam: (state) => {
            if (!state.currentBattle) return [];
            return state.isChallenger ? state.currentBattle.challengerTeam : state.currentBattle.opponentTeam;
        },
        opponentTeam: (state) => {
            if (!state.currentBattle) return [];
            return state.isChallenger ? state.currentBattle.opponentTeam : state.currentBattle.challengerTeam;
        },
        activeMyPokemon: (state) => {
            if (!state.currentBattle) return null;
            const index = state.isChallenger ? state.currentBattle.activePokemonChallenger : state.currentBattle.activePokemonOpponent;
            return state.myTeam[index] || null;
        },
        activeOpponentPokemon: (state) => {
            if (!state.currentBattle) return null;
            const index = state.isChallenger ? state.currentBattle.activePokemonOpponent : state.currentBattle.activePokemonChallenger;
            return state.opponentTeam[index] || null;
        }
    },
    
    actions: {
        async fetchBattle(battleId) {
            this.loading = true;
            this.error = null;
            try {
                const res = await api.get(`/battles/${battleId}`);
                this.currentBattle = res.data.battle;
                this.hasSelectedMove = false;
                
                // Keep everything in sync, we do NOT empty logs manually here 
                // because we might rejoin mid-battle. Visual processing will just read the log history if needed.
            } catch (err) {
                this.error = err.response?.data?.error || 'Error fetching battle';
            } finally {
                this.loading = false;
            }
        },

        joinBattleRoom(battleId) {
            const socket = socketService.getSocket();
            if(!socket) return;
            
            socket.emit('join_battle', battleId);
            this.battleRoomJoined = true;
            
            // Re-bind listeners just in case
            socket.off('turn_result');
            socket.off('opponent_move_selected');
            socket.off('player_joined');

            socket.on('player_joined', (data) => {
                console.log('Player joined battle room:', data);
            });

            socket.on('opponent_move_selected', (data) => {
                // We can use this to show "Opponent is ready!"
                console.log('Opponent selected move!');
            });

            socket.on('turn_result', (data) => {
                console.log('Turn result arrived:', data.battle);
                const oldLogsLength = this.currentBattle?.battleLog?.length || 0;
                this.currentBattle = data.battle;
                this.hasSelectedMove = false; // Reset for next turn
                
                // Extract only the new logs to enqueue them for the visualizer
                const newLogsLength = this.currentBattle.battleLog?.length || 0;
                if (newLogsLength > oldLogsLength) {
                    const diff = this.currentBattle.battleLog.slice(oldLogsLength);
                    this.turnLogs.push(...diff);
                }
            });
        },

        leaveBattleRoom(battleId) {
            const socket = socketService.getSocket();
            if (socket) {
                socket.emit('leave_battle', battleId);
                socket.off('turn_result');
                socket.off('opponent_move_selected');
                socket.off('player_joined');
            }
            this.battleRoomJoined = false;
            this.currentBattle = null;
            this.turnLogs = [];
            this.hasSelectedMove = false;
        },

        selectMove(battleId, moveName) {
            const socket = socketService.getSocket();
            if (socket && !this.hasSelectedMove) {
                this.hasSelectedMove = true;
                socket.emit('select_move', { battleId, move: moveName });
            }
        },
        
        clearNextLog() {
            if (this.turnLogs.length > 0) {
                this.turnLogs.shift();
            }
        }
    }
});
