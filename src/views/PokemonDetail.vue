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
        </div>

        <div class="main-content">
             <div class="card glass-panel visual-section">
                <img :src="pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default" :alt="pokemon.name" class="main-image" />
                <div class="physical-info" v-if="pokemon.height && pokemon.weight">
                    <div class="info-box">
                        <span class="info-label">ALTURA</span>
                        <span class="info-value">{{ pokemon.height / 10 }} m</span>
                    </div>
                    <div class="info-box">
                        <span class="info-label">PESO</span>
                        <span class="info-value">{{ pokemon.weight / 10 }} kg</span>
                    </div>
                </div>
             </div>

             <div class="right-col">
                 <div class="card glass-panel stats-section">
                    <h2>Estadísticas Base</h2>
                    <div class="stat-row" v-for="(value, name) in stats" :key="name">
                        <span class="stat-name">{{ statTranslations[name] || name }}</span>
                        <div class="stat-bar-container">
                            <div class="stat-bar" :style="{ width: Math.min(value, 150) + '%', backgroundColor: value > 100 ? '#48bb78' : '#6366f1' }"></div>
                        </div>
                        <span class="stat-value">{{ value }}</span>
                    </div>
                 </div>

                 <div class="card glass-panel abilities-section" v-if="pokemon.abilities">
                    <h2>Habilidades</h2>
                    <div class="abilities-list">
                        <div v-for="ab in pokemon.abilities" :key="ab.name" class="ability-pill">
                            {{ ab.name.replace('-', ' ') }}
                            <span v-if="ab.isHidden" class="hidden-badge">OCULTA</span>
                        </div>
                    </div>
                 </div>
             </div>
        </div>

        <div class="two-col" v-if="pokemon.encounters && pokemon.encounters.length">
            <div class="card glass-panel encounters-section">
                <h2>Posibles Encuentros</h2>
                <ul class="encounters-list">
                    <li v-for="loc in pokemon.encounters" :key="loc">{{ loc }}</li>
                </ul>
            </div>
            
            <div class="evolution-section card glass-panel" v-if="pokemon.evolutionChain && pokemon.evolutionChain.length > 1">
                 <h2>Cadena Evolutiva</h2>
                 <div class="evolution-row">
                     <div v-for="evo in pokemon.evolutionChain" :key="evo.id" class="evo-item">
                         <img :src="evo.sprite" :alt="evo.name" class="evo-img" />
                         <span class="evo-name">{{ evo.name }}</span>
                     </div>
                 </div>
            </div>
        </div>

        <div class="card glass-panel moves-section" v-if="pokemon.moves && pokemon.moves.length">
            <h2>Movimientos</h2>
            <div class="moves-grid">
                <div class="move-card" v-for="move in pokemon.moves" :key="move.name">
                    <span class="move-name">{{ move.name.replace('-', ' ') }}</span>
                    <div class="move-tags">
                        <span class="move-method">{{ move.method }}</span>
                        <span v-if="move.level > 0" class="move-level">Lvl {{ move.level }}</span>
                    </div>
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
    gap: 1.5rem;
    padding-bottom: 2rem;
}

.header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-section {
    display: flex;
    align-items: baseline;
    gap: 1rem;
}

h1, h2 {
    margin: 0;
    text-transform: capitalize;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 1.4rem; margin-bottom: 1.2rem; }

.id-badge { color: #a0aec0; font-size: 1.5rem; }

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

/* Grids / Layouts */
.main-content {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 1.5rem;
}

.right-col {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.card { padding: 1.5rem 2rem; }

/* Visual & Physical */
.visual-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.main-image {
    width: 250px;
    height: 250px;
    object-fit: contain;
    filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
}

.physical-info {
    display: flex;
    gap: 3rem;
    background: rgba(255,255,255,0.05);
    padding: 1rem 2rem;
    border-radius: 12px;
    width: 100%;
    justify-content: space-around;
}

.info-box {
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 0.3rem;
}

.info-label { font-size: 0.8rem; color: #a0aec0; letter-spacing: 1px; }
.info-value { font-size: 1.2rem; font-weight: bold; }

/* Stats */
.stat-row {
    display: flex;
    align-items: center;
    margin-bottom: 0.8rem;
    gap: 1rem;
}

.stat-name {
    width: 100px;
    text-transform: capitalize;
    font-weight: 500;
    font-size: 0.95rem;
    color: #e2e8f0;
}

.stat-value { width: 30px; text-align: right; font-family: monospace; font-size: 1.05rem;}

.stat-bar-container {
    flex: 1;
    height: 8px;
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    overflow: hidden;
}

.stat-bar { height: 100%; border-radius: 4px; transition: width 1s ease-out; }

/* Abilities */
.abilities-list { display: flex; gap: 1rem; flex-wrap: wrap; }
.ability-pill {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-transform: capitalize;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.hidden-badge {
    background: #dd6b20;
    color: white;
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-weight: bold;
}

/* Encounters */
.encounters-list {
    margin: 0; padding: 0; list-style: none;
    max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;
}
.encounters-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    text-transform: capitalize;
    color: #cbd5e0;
}
.encounters-list li:last-child { border-bottom: none; }

/* Evolutions */
.evolution-row {
    display: flex; justify-content: space-around; align-items: center; padding-top: 1rem;
}
.evo-item {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
}
.evo-img { width: 80px; height: 80px; object-fit: contain; }
.evo-name { text-transform: capitalize; font-weight: 500; }

/* Moves */
.moves-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 1rem;
}
.move-card {
    background: rgba(255,255,255,0.05);
    padding: 0.8rem 1rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.move-name { text-transform: capitalize; font-weight: 500; font-size: 1.05rem; }
.move-tags { display: flex; gap: 0.5rem; }
.move-method {
    background: rgba(255,255,255,0.2);
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
}
.move-level {
    background: #48bb78;
    color: white;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    .main-content, .two-col {
        grid-template-columns: 1fr;
    }
    .physical-info {
        gap: 1.5rem;
    }
    .stat-row {
        gap: 0.5rem;
    }
    .stat-name {
        width: 80px;
        font-size: 0.85rem;
    }
    .moves-grid {
        grid-template-columns: 1fr;
    }
    .evolution-row {
        flex-direction: column;
        gap: 1.5rem;
    }
    .card {
        padding: 1.5rem 1rem;
    }
}
</style>
