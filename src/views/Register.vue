<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const name = ref('');
const nickname = ref('');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleRegister = async () => {
    loading.value = true;
    error.value = '';
    try {
        await authStore.register(email.value, password.value, name.value, nickname.value);
        // Clear auto-login state to force manual login as requested
        authStore.logout();
        router.push('/login');
    } catch (err) {
        error.value = err;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="auth-container">
        <div class="auth-card glass-panel">
            <h2>Únete a la Aventura</h2>
            <form @submit.prevent="handleRegister">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" v-model="name" required placeholder="Ash Ketchum" />
                </div>
                <div class="form-group">
                    <label>Apodo (Opcional)</label>
                    <input type="text" v-model="nickname" placeholder="El Maestro" />
                </div>
                <div class="form-group">
                    <label>Correo Electrónico *</label>
                    <input type="email" v-model="email" required placeholder="entrenador@pokemon.com" />
                </div>
                <div class="form-group">
                    <label>Contraseña *</label>
                    <input type="password" v-model="password" required placeholder="••••••••" />
                </div>
                <div v-if="error" class="error">{{ error }}</div>
                <button type="submit" class="btn" :disabled="loading">
                    {{ loading ? 'Creando Cuenta...' : 'Registrarse' }}
                </button>
            </form>
            <p class="switch-auth">
                ¿Ya tienes una cuenta? <router-link to="/login">Inicia Sesión</router-link>
            </p>
        </div>
    </div>
</template>

<style scoped>
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
}

.auth-card {
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    text-align: center;
}

h2 {
    margin-bottom: 2rem;
    color: var(--secondary-color);
}

.form-group {
    margin-bottom: 1.5rem;
    text-align: left;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    color: #a0aec0;
}

.btn {
    width: 100%;
    margin-top: 1rem;
}

.error {
    color: #ff4d4d;
    margin-bottom: 1rem;
}

.switch-auth {
    margin-top: 1.5rem;
    color: #a0aec0;
}
</style>
