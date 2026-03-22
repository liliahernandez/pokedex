import { defineStore } from 'pinia';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';
import { notificationService } from '../services/notifications';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: sessionStorage.getItem('token') || null,
        isAuthenticated: !!sessionStorage.getItem('token')
    }),
    actions: {
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
            
            // Connect to real-time events immediately
            initSocket(data.token);
            
            // Ask for notification permission (premium feature)
            notificationService.requestPermission();
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
