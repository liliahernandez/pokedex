<script setup>
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePokemonStore } from '../stores/pokemon';
import { useUserStore } from '../stores/user';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const pokemonStore = usePokemonStore();
const userStore = useUserStore();
const authStore = useAuthStore();

onMounted(async () => {
    await pokemonStore.fetchPokemonDetails(route.params.id);
    if (authStore.isAuthenticated) {
        await userStore.fetchFavorites();
    }
});

const pokemon = computed(() => pokemonStore.currentPokemon);
const isFavorite = computed(() => {
    if (!userStore.favorites || !pokemon.value) return false;
    return userStore.favorites.some(f => f.pokemonId === pokemon.value.id);
});

const toggleFavorite = async () => {
    if (!authStore.isAuthenticated) return alert('Por favor inicia sesión primero');
    try {
        if (isFavorite.value) {
            await userStore.removeFavorite(pokemon.value.id);
        } else {
            await userStore.addFavorite(pokemon.value.id);
        }
    } catch (error) {
        alert(error);
    }
};

const stats = computed(() => pokemon.value?.stats || {});

const statTranslations = {
    hp: 'PS',
    attack: 'Ataque',
    defense: 'Defensa',
    'special-attack': 'Ataque Esp.',
    'special-defense': 'Defensa Esp.',
    speed: 'Velocidad'
};
</script>

<template>
    <div v-if="pokemon" class="detail-container">
        <div class="header glass-panel">
            <div class="header-content">
                <div class="title-section">
                    <h1>{{ pokemon.name }}</h1>
                    <span class="id-badge">#{{ pokemon.id }}</span>
                </div>
                 <div class="types">
                    <span v-for="type in pokemon.types" :key="type.name" class="type-badge">{{ type.name }}</span>
                </div>
            </div>
             <button class="favorite-btn" @click="toggleFavorite" :class="{ active: isFavorite }">
                {{ isFavorite ? '★ Quitar de Favoritos' : '☆ Añadir a Favoritos' }}
            </button>
        </div>

        <div class="main-content">
             <div class="card glass-panel visual-section">
                <img :src="pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default" :alt="pokemon.name" class="main-image" />
             </div>

             <div class="card glass-panel stats-section">
                <h2>Estadísticas</h2>
                <div class="stat-row" v-for="(value, name) in stats" :key="name">
                    <span class="stat-name">{{ statTranslations[name] || name }}</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar" :style="{ width: Math.min(value, 150) + '%', backgroundColor: value > 100 ? '#48bb78' : '#6366f1' }"></div>
                    </div>
                    <span class="stat-value">{{ value }}</span>
                </div>
             </div>
        </div>

        <div class="evolution-section card glass-panel" v-if="pokemon.evolutionChain">
             <h2>Cadena Evolutiva</h2>
             <div class="evolution-row">
                 <div v-for="evo in pokemon.evolutionChain" :key="evo.order" class="evo-item">
                     <span>{{ evo.name }}</span>
                 </div>
             </div>
        </div>
    </div>
</template>

<style scoped>
.detail-container {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.header {
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-section {
    display: flex;
    align-items: baseline;
    gap: 1rem;
}

h1 {
    margin: 0;
    text-transform: capitalize;
    font-size: 2.5rem;
}

.id-badge {
    color: #a0aec0;
    font-size: 1.5rem;
}

.types {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
}

.type-badge {
    background: rgba(255,255,255,0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    text-transform: capitalize;
}

.favorite-btn {
    background: transparent;
    border: 1px solid var(--text-color);
    color: var(--text-color);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.favorite-btn.active {
    background: var(--secondary-color);
    border-color: var(--secondary-color);
    color: white;
}

.main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.card {
    padding: 2rem;
    display: flex;
    flex-direction: column;
}

.visual-section {
    align-items: center;
    justify-content: center;
}

.main-image {
    width: 300px;
    height: 300px;
    object-fit: contain;
    filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
}

.stat-row {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
}

.stat-name {
    width: 100px;
    text-transform: capitalize;
    font-weight: 500;
}

.stat-value {
    width: 30px;
    text-align: right;
    font-family: monospace;
}

.stat-bar-container {
    flex: 1;
    height: 8px;
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    overflow: hidden;
}

.stat-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 1s ease-out;
}
</style>
