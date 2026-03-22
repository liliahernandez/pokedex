<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const navigateTo = (path) => {
    router.push(path);
};
</script>

<template>
    <div class="dashboard-container">
        <div class="welcome-section glass-panel">
            <h1>Bienvenido a la Pokedex App</h1>
            <p v-if="authStore.user">¡Hola! {{ authStore.user.name || authStore.user.email }}, ¿Listo para explorar?</p>
            <p v-else>Por favor inicia sesión para acceder a todas las funciones.</p>
        </div>

        <div class="actions-grid">
            <div class="action-card glass-panel" @click="navigateTo('/pokedex')">
                <div class="icon">🔍</div>
                <h2>Pokedex</h2>
                <p>Explora todos los Pokemon</p>
            </div>

            <div class="action-card glass-panel" @click="navigateTo('/teams')">
                <div class="icon">⚔️</div>
                <h2>Mi Equipo</h2>
                <p>Administra tu equipo de batalla</p>
            </div>

            <div class="action-card glass-panel" @click="navigateTo('/favorites')">
                <div class="icon">⭐</div>
                <h2>Favoritos</h2>
                <p>Mira tus favoritos</p>
            </div>

            <div class="action-card glass-panel" @click="navigateTo('/friends')">
                <div class="icon">👥</div>
                <h2>Amigos</h2>
                <p>Conecta con otros entrenadores</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.welcome-section {
    text-align: center;
    padding: 3rem;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
    border: 1px solid rgba(255,255,255,0.2);
}

.welcome-section h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(to right, #ffcb05, #3c5aa6);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
}

.welcome-section p {
    font-size: 1.2rem;
    color: #e2e8f0;
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.action-card {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255,255,255,0.1);
}

.action-card:hover {
    transform: translateY(-10px);
    background: rgba(255,255,255,0.15);
    border-color: #ffcb05;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.action-card h2 {
    color: #ffcb05;
    margin-bottom: 0.5rem;
}

.action-card p {
    color: #cbd5e0;
}
</style>
