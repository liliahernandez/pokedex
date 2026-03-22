<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(email.value, password.value);
    router.push('/');
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
      <h2>Bienvenido de nuevo</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Correo Electrónico</label>
          <input type="email" v-model="email" required placeholder="entrenador@pokemon.com" />
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" v-model="password" required placeholder="••••••••" />
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>
      <p class="switch-auth">
        ¿No tienes una cuenta? <router-link to="/register">Regístrate</router-link>
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
  padding: 3rem 2rem;
  width: 100%;
  max-width: 420px;
  text-align: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(12px);
}

h2 {
  margin-bottom: 2rem;
  font-size: 2rem;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 4px;
}

.error {
  color: #ef4444;
  margin-bottom: 1rem;
  font-weight: 500;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
}

.btn {
  width: 100%;
  margin-top: 0.5rem;
}

.switch-auth {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.switch-auth a {
  color: var(--primary-color);
  font-weight: 600;
}

.switch-auth a:hover {
  color: var(--secondary-color);
  text-decoration: underline;
}
</style>
