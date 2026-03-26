import { defineStore } from 'pinia';
import api from '../services/api';
import * as socketService from '../services/socket';

// Module-level BroadcastChannel — stays alive forever, not GC'd
const syncChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('pokedex-sync')
    : null;

export const useUserStore = defineStore('user', {
    state: () => ({
        favorites: [],
        teams: [],
        friends: [],
        pendingRequests: []
    }),
    actions: {
        async fetchFavorites() {
            try {
                const response = await api.get('/favorites');
                this.favorites = response.data.favorites;
            } catch (error) {
                console.error('Error fetching favorites', error);
            }
        },
        async addFavorite(pokemonId) {
            try {
                const response = await api.post('/favorites', { pokemonId });
                this.favorites = response.data.favorites;
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                throw error;
            }
        },
        async removeFavorite(pokemonId) {
            try {
                const response = await api.delete(`/favorites/${pokemonId}`);
                this.favorites = response.data.favorites;
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                console.error('Error removing favorite', error);
            }
        },
        async fetchTeams() {
            try {
                const response = await api.get('/favorites/teams');
                this.teams = response.data.teams;
            } catch (error) {
                console.error('Error fetching teams', error);
            }
        },
        async createTeam(name, pokemonData) {
            try {
                const isArrayOfIds = pokemonData.length > 0 && typeof pokemonData[0] !== 'object';
                const payload = isArrayOfIds ? { name, pokemonIds: pokemonData } : { name, pokemon: pokemonData };
                await api.post('/favorites/teams', payload);
                this.fetchTeams();
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                throw error;
            }
        },
        async fetchFriends() {
            try {
                const response = await api.get(`/auth/friends?t=${Date.now()}`);
                this.friends = response.data.friends;
            } catch (error) {
                console.error('Error fetching friends', error);
            }
        },
        async fetchPendingRequests() {
            try {
                const response = await api.get('/auth/friends/pending');
                this.pendingRequests = response.data.pending || [];
            } catch (error) {
                console.error('Error fetching pending requests', error);
            }
        },
        async sendFriendRequest(friendCode) {
            try {
                const response = await api.post('/auth/friends', { friendCode, action: 'send_request' });
                
                // Start a polling fallback for 30 seconds to ensure the UI updates if socket fails
                let attempts = 0;
                const pollInterval = setInterval(async () => {
                    attempts++;
                    const oldFriendsCount = this.friends.length;
                    await this.fetchFriends();
                    
                    // If a friend was added, stop polling
                    if (this.friends.length > oldFriendsCount || attempts >= 10) {
                        clearInterval(pollInterval);
                    }
                }, 3000);

                return response.data;
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                throw error.response?.data?.error || 'Error al enviar solicitud de amistad';
            }
        },
        async acceptFriendRequest(friendId) {
            try {
                const response = await api.post('/auth/friends', { friendId, action: 'accept_request' });
                this.fetchFriends(); // Update local list
                return response.data;
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                throw error.response?.data?.error || 'Error al aceptar solicitud';
            }
        },
        async removeFriend(friendId) {
            try {
                await api.delete(`/auth/friends/${friendId}`);
                this.fetchFriends();
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                throw error.response?.data?.error || 'Error al eliminar amigo';
            }
        },
        async deleteTeam(teamId) {
            try {
                await api.delete(`/favorites/teams/${teamId}`);
                this.teams = this.teams.filter(t => t.id !== teamId);
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                console.error('Error deleting team', error);
                throw error;
            }
        },
        async updateTeam(teamId, name, pokemonData) {
            try {
                const isArrayOfIds = pokemonData.length > 0 && typeof pokemonData[0] !== 'object';
                const payload = isArrayOfIds ? { name, pokemonIds: pokemonData } : { name, pokemon: pokemonData };
                const response = await api.put(`/favorites/teams/${teamId}`, payload);
                const index = this.teams.findIndex(t => t.id === teamId);
                if (index !== -1) {
                    this.teams[index] = response.data.team;
                } else {
                    this.fetchTeams();
                }
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                console.error('Error updating team', error);
                throw error;
            }
        },
        async createBattle(opponentId, teamId) {
            try {
                const response = await api.post('/battles', { opponentId, teamId });
                return response.data;
            } catch (error) {
                if (error.isOfflineSync) throw error.message;
                throw error.response?.data?.error || 'Error al crear la batalla';
            }
        },
        listenForFriendEvents() {
            if (this._listenersBound) return;
            this._listenersBound = true;

            socketService.on('connect', () => {
                console.log('[UserStore] Socket connected, refreshing data...');
                this.fetchFriends();
                this.fetchPendingRequests();
            });

            // Use NEW persistent listener system
            socketService.on('friendship_updated', (data) => {
                console.log('[UserStore] Friendship updated, refreshing list...', data);
                this.fetchFriends();
            });

            // Legacy support for older clients
            socketService.on('friend_request_accepted', () => {
                console.log('[UserStore] Legacy friendship update received');
                this.fetchFriends();
            });

            socketService.on('friend_request', (data) => {
                console.log('[UserStore] New friend request received, refreshing pending list...', data);
                this.fetchPendingRequests();
            });

            socketService.on('battle_request', (data) => {
                console.log('[UserStore] Incoming battle request:', data);
                if (window.confirm(`¡${data.challengerName || 'Un amigo'} te ha desafiado a una batalla Pokémon!\n¿Aceptar y entrar a la arena?`)) {
                    window.location.href = `/battle/${data.battleId}`;
                }
            });

            // BroadcastChannel for cross-context sync (SW to App)
            if (syncChannel) {
                syncChannel.onmessage = async (event) => {
                    const msg = event.data;
                    if (!msg) return;
                    const store = this;

                    if (msg.type === 'ACCEPT_FRIEND_REQUEST' && msg.requesterId) {
                        console.log('[UserStore] BC: Accepting friend request, requesterId:', msg.requesterId);
                        await store.acceptFriendRequest(msg.requesterId);
                        await store.fetchFriends();
                    }

                    if (msg.type === 'NOTIFICATION_ACTION' && msg.action === 'accept-friend' && msg.data?.requesterId) {
                        console.log('[UserStore] BC: Legacy accept, requesterId:', msg.data.requesterId);
                        await store.acceptFriendRequest(msg.data.requesterId);
                        await store.fetchFriends();
                    }

                    if (msg.type === 'REFRESH_FRIENDS') {
                        console.log('[UserStore] BC: Refresh requested by SW');
                        await store.fetchFriends();
                    }
                };
                console.log('[UserStore] BroadcastChannel listener attached');
            }

            // Also listen for messages from the Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', async (event) => {
                    if (!event.data) return;
                    
                    if (event.data.type === 'REFRESH_FRIENDS') {
                        console.log('[UserStore] Refresh requested by Service Worker');
                        this.fetchFriends();
                    }
                    
                    if (event.data.type === 'ACCEPT_FRIEND_REQUEST' && event.data.requesterId) {
                        console.log('[UserStore] SW: Accepting friend request, requesterId:', event.data.requesterId);
                        await this.acceptFriendRequest(event.data.requesterId);
                        await this.fetchFriends();
                    }
                });
            }
        },
        getSocket() {
            return socketService.getSocket();
        }
    }
});
