<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
    challenge: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close']);
const router = useRouter();

const accept = () => {
    router.push(`/battle/${props.challenge.battleId}`);
    emit('close');
};
</script>

<template>
    <div class="battle-invite glass-panel">
        <div class="header">
            <span class="pulse-icon">⚔️</span>
            <h3>¡Desafío Entrante!</h3>
        </div>
        <p><strong>{{ challenge.challengerName }}</strong> te ha retado a una batalla en tiempo real.</p>
        <div class="actions">
            <button class="btn dismiss" @click="$emit('close')">Luego</button>
            <button class="btn accept" @click="accept">ACEPTAR</button>
        </div>
    </div>
</template>

<style scoped>
.battle-invite {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 320px;
    z-index: 10001;
    padding: 1.2rem;
    border: 2px solid var(--primary-color);
    box-shadow: 0 10px 50px rgba(0,0,0,0.6);
    animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background: rgba(15, 23, 42, 0.98);
}

@keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

.header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.5rem;
}

.header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--primary-color);
}

.pulse-icon {
    font-size: 1.5rem;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

p {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
}

.actions {
    display: flex;
    gap: 0.8rem;
}

.btn {
    flex: 1;
    padding: 0.6rem;
    font-weight: bold;
    font-size: 0.85rem;
    border-radius: var(--radius-sm);
    transition: all 0.2s;
}

.accept {
    background: var(--primary-color);
    color: white;
}

.accept:hover {
    background: var(--secondary-color);
    transform: scale(1.05);
}

.dismiss {
    background: transparent;
    border: 1px solid #475569;
    color: #94a3b8;
}

.dismiss:hover {
    background: rgba(255,255,255,0.05);
}
</style>
