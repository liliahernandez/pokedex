<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const isMenuOpen = ref(false);

const logout = () => {
  authStore.logout();
  router.push('/login');
  isMenuOpen.value = false;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};
</script>

<template>
  <nav class="navbar glass-panel">
    <div class="logo">
      <router-link to="/" @click="closeMenu">PokeApp</router-link>
    </div>

    <!-- Sandwich Menu Button (Visible on Mobile) -->
    <button class="mobile-menu-btn" @click="isMenuOpen = !isMenuOpen" aria-label="Toggle menu">
      <span :class="{ 'open': isMenuOpen }"></span>
      <span :class="{ 'open': isMenuOpen }"></span>
      <span :class="{ 'open': isMenuOpen }"></span>
    </button>

    <div class="links" :class="{ 'open': isMenuOpen }">
      <template v-if="authStore.isAuthenticated">
        <router-link to="/" class="nav-link" @click="closeMenu">Inicio</router-link>
        <router-link to="/pokedex" class="nav-link" @click="closeMenu">Pokedex</router-link>
        <router-link to="/favorites" class="nav-link" @click="closeMenu">Favoritos</router-link>
        <router-link to="/teams" class="nav-link" @click="closeMenu">Equipos</router-link>
        <router-link to="/friends" class="nav-link" @click="closeMenu">Amigos</router-link>
        <div class="user-info">
            <span class="user-email">{{ authStore.user?.name || authStore.user?.email }}</span>
            <button @click="logout" class="btn logout-btn">Cerrar Sesión</button>
        </div>
      </template>
      <template v-else>
        <router-link to="/login" class="nav-link" @click="closeMenu">Iniciar Sesión</router-link>
        <router-link to="/register" class="nav-link" @click="closeMenu">Registrarse</router-link>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
  position: sticky;
  top: calc(10px + env(safe-area-inset-top));
  z-index: 1000;
  border-radius: var(--radius-lg);
}

.logo a {
  font-size: 1.8rem;
  font-weight: 800;
  text-decoration: none;
  background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
  text-shadow: 0 0 30px rgba(34, 211, 238, 0.3);
}

.links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  transition: all 0.3s ease-in-out;
}

.nav-link {
  color: var(--text-muted);
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
  font-size: 0.95rem;
  text-align: center;
}

.nav-link:hover, .router-link-active {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
}

.router-link-active {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255, 255, 255, 0.08);
}

.user-info {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    border-left: 1px solid var(--glass-border);
    padding-left: 1.5rem;
}

.user-email {
  font-size: 0.9rem;
  color: var(--text-muted);
  word-break: break-all;
}

.logout-btn {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.5rem 1.2rem;
  font-size: 0.85rem;
  border-radius: var(--radius-sm);
  transition: all 0.3s;
  cursor: pointer;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
  color: #f87171;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1001;
}

.mobile-menu-btn span {
  width: 100%;
  height: 3px;
  background-color: var(--text-main); /* White-ish line */
  border-radius: 10px;
  transition: all 0.3s linear;
  transform-origin: 1px;
}

/* Animations for Hamburger to turn into an X */
.mobile-menu-btn span.open:nth-child(1) {
  transform: rotate(45deg);
}
.mobile-menu-btn span.open:nth-child(2) {
  opacity: 0;
}
.mobile-menu-btn span.open:nth-child(3) {
  transform: rotate(-45deg);
}

/* Responsive Mode */
@media (max-width: 900px) {
  .mobile-menu-btn {
    display: flex;
  }
  
  .navbar {
    padding: 1rem;
    position: relative; /* Context for absolute dropdown */
  }

  .links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(15, 23, 42, 0.98); /* Solid dark theme background */
    backdrop-filter: blur(15px);
    flex-direction: column;
    padding: 0;
    gap: 0;
    border-radius: var(--radius-lg);
    border: 1px solid var(--glass-border);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    
    /* Initially hidden by sliding up and fading out */
    transform: translateY(-20px);
    opacity: 0;
    visibility: hidden;
    overflow: hidden;
  }

  .links.open {
    transform: translateY(10px);
    opacity: 1;
    visibility: visible;
    padding: 1rem 0;
    gap: 0.5rem;
  }

  .nav-link {
    width: 90%;
    margin: 0 auto;
    padding: 0.8rem;
    border-radius: var(--radius-sm);
  }

  .user-info {
    flex-direction: column;
    border-left: none;
    border-top: 1px solid var(--glass-border);
    padding: 1.5rem 0 0.5rem 0;
    margin-top: 1rem;
    width: 100%;
    text-align: center;
    gap: 1rem;
  }
}
</style>
