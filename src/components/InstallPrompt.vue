<script setup>
import { usePWAStore } from '../stores/pwa';

const pwaStore = usePWAStore();

const handleInstall = () => {
    pwaStore.installApp();
};
</script>

<template>
  <div v-if="pwaStore.isInstallable" class="install-prompt glass-panel" @click="handleInstall">
    <div class="icon">📲</div>
    <div class="content">
        <strong>Añadir PokeApp a Inicio</strong>
        <span>Disfruta de la mejor experiencia sin salir del navegador.</span>
    </div>
    <button class="btn install-btn">Añadir</button>
  </div>
</template>

<style scoped>
.install-prompt {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    z-index: 10000;
    cursor: pointer;
    border: 1px solid var(--primary-color);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.5s ease-out;
    max-width: 90%;
    width: 400px;
}

.icon {
    font-size: 1.5rem;
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.content strong {
    font-size: 1rem;
    color: var(--text-main);
}

.content span {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.install-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    background: var(--primary-color);
    color: white;
}

@keyframes slideUp {
    from { transform: translate(-50%, 100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

@media (max-width: 600px) {
    .install-prompt {
        bottom: 1rem;
    }
}
</style>
