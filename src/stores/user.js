import { defineStore } from 'pinia';
import api from '../services/api';
import * as socketService from '../services/socket';

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
                throw error;
            }
        },
        async removeFavorite(pokemonId) {
            try {
                const response = await api.delete(`/favorites/${pokemonId}`);
                this.favorites = response.data.favorites;
            } catch (error) {
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
        async createTeam(name, pokemonIds) {
            try {
                await api.post('/favorites/teams', { name, pokemonIds });
                this.fetchTeams();
            } catch (error) {
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
                return response.data;
            } catch (error) {
                throw error.response?.data?.error || 'Error al enviar solicitud de amistad';
            }
        },
        async acceptFriendRequest(friendId) {
            try {
                const response = await api.post('/auth/friends', { friendId, action: 'accept_request' });
                this.fetchFriends(); // Update local list
                return response.data;
            } catch (error) {
                throw error.response?.data?.error || 'Error al aceptar solicitud';
            }
        },
        async removeFriend(friendId) {
            try {
                await api.delete(`/auth/friends/${friendId}`);
                this.fetchFriends();
            } catch (error) {
                throw error.response?.data?.error || 'Error al eliminar amigo';
            }
        },
        async deleteTeam(teamId) {
            try {
                await api.delete(`/favorites/teams/${teamId}`);
                this.teams = this.teams.filter(t => t.id !== teamId);
            } catch (error) {
                console.error('Error deleting team', error);
                throw error;
            }
        },
        async updateTeam(teamId, name, pokemonIds) {
            try {
                const response = await api.put(`/favorites/teams/${teamId}`, { name, pokemonIds });
                const index = this.teams.findIndex(t => t.id === teamId);
                if (index !== -1) {
                    this.teams[index] = response.data.team;
                } else {
                    this.fetchTeams();
                }
            } catch (error) {
                console.error('Error updating team', error);
                throw error;
            }
        },
        async createBattle(opponentId, teamId) {
            try {
                const response = await api.post('/battles', { opponentId, teamId });
                return response.data;
            } catch (error) {
                throw error.response?.data?.error || 'Error al crear la batalla';
            }
        },
        listenForFriendEvents() {
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

            // Also listen for messages from the Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'REFRESH_FRIENDS') {
                        console.log('[UserStore] Refresh requested by Service Worker');
                        this.fetchFriends();
                    }
                });
            }
        },
        getSocket() {
            return socketService.getSocket();
        }
    }
});
