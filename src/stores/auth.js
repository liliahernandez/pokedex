import { defineStore } from 'pinia';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';
import { notificationService } from '../services/notifications';
import { getAuthToken, saveAuthToken } from '../services/offlineStorage';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
        isAuthenticated: false
    }),
    actions: {
        async initAuth() {
            // 1. Try sessionStorage (fastest)
            let token = sessionStorage.getItem('token');
            
            // 2. Try IndexedDB (persistent fallback)
            if (!token) {
                token = await getAuthToken();
            }

            if (token) {
                this.token = token;
                this.isAuthenticated = true;
                // Verify with server
                await this.fetchProfile();

                // 3. Process any pending friend accept from notification tap
                const pendingAccept = localStorage.getItem('pending-accept-friend');
                if (pendingAccept) {
                    localStorage.removeItem('pending-accept-friend');
                    console.log('[Auth] Processing pending friend accept:', pendingAccept);
                    try {
                        const { useUserStore } = await import('./user');
                        const userStore = useUserStore();
                        await userStore.acceptFriendRequest(pendingAccept);
                        await userStore.fetchFriends();
                        console.log('[Auth] Pending friend accept processed!');
                    } catch (e) {
                        console.error('[Auth] Error processing pending accept:', e);
                    }
                }
            }
        },
        async register(email, password, name, nickname) {
            try {
                const response = await api.post('/auth/register', { email, password, name, nickname });
                this.setAuth(response.data);
                return response.data;
            } catch (error) {
                throw error.response?.data?.error || 'Registration failed';
            }
        },
        async login(email, password) {
            try {
                const response = await api.post('/auth/login', { email, password });
                this.setAuth(response.data);
                return response.data;
            } catch (error) {
                throw error.response?.data?.error || 'Login failed';
            }
        },
        setAuth(data) {
            this.token = data.token;
            this.user = data.user;
            this.isAuthenticated = true;
            sessionStorage.setItem('token', data.token);
            saveAuthToken(data.token); // Save for SW access
            
            // Connect to real-time events immediately
            initSocket(data.token);
        },
        logout() {
            this.token = null;
            this.user = null;
            this.isAuthenticated = false;
            sessionStorage.removeItem('token');
            disconnectSocket();
        },
        async fetchProfile() {
            if (!this.token) return;
            try {
                const response = await api.get('/auth/profile');
                this.user = response.data.user;
                // Also init socket here if they refreshed the page with an existing token
                initSocket(this.token);
            } catch (error) {
                this.logout();
            }
        }
    }
});
