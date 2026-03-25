<script setup>
import { onMounted, ref, watch } from 'vue';
import { usePokemonStore } from '../stores/pokemon';
import PokemonCard from '../components/PokemonCard.vue';
import { useRouter } from 'vue-router';

const pokemonStore = usePokemonStore();
const router = useRouter();

const searchQuery = ref('');
const selectedType = ref('');
const selectedGeneration = ref('');

const regionTranslations = {
  'generation-i': 'Kanto',
  'generation-ii': 'Johto',
  'generation-iii': 'Hoenn',
  'generation-iv': 'Sinnoh',
  'generation-v': 'Unova',
  'generation-vi': 'Kalos',
  'generation-vii': 'Alola',
  'generation-viii': 'Galar',
  'generation-ix': 'Paldea'
};

const typeTranslations = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  steel: 'Acero',
  fairy: 'Hada'
};

onMounted(() => {
    pokemonStore.fetchPokemonList();
    pokemonStore.fetchTypes();
    pokemonStore.fetchGenerations();
});

const handleSearch = () => {
    selectedType.value = '';
    selectedGeneration.value = '';
    if (searchQuery.value) {
        pokemonStore.searchPokemon(searchQuery.value);
    } else {
        pokemonStore.fetchPokemonList();
    }
};

const handleTypeFilter = () => {
    selectedGeneration.value = '';
    searchQuery.value = '';
    if (selectedType.value) {
        pokemonStore.filterByType(selectedType.value);
    } else {
        pokemonStore.fetchPokemonList();
    }
};

const handleGenFilter = () => {
    selectedType.value = '';
    searchQuery.value = '';
    if (selectedGeneration.value) {
        pokemonStore.filterByGeneration(selectedGeneration.value);
    } else {
        pokemonStore.fetchPokemonList();
    }
};

const goToDetails = (id) => {
    router.push(`/pokemon/${id}`);
};

const loadMore = () => {
    // Implement standard pagination or infinite scroll using store actions
    // For now simple reload or next page if store supported "loadMore" appending
    // But store just replaces list. Let's just keep it simple for MVP.
};
</script>

<template>
    <div class="home-container">
        <div class="filters glass-panel">
            <input 
                v-model="searchQuery" 
                @keyup.enter="handleSearch" 
                placeholder="Buscar Pokemon..." 
                class="search-input"
            />
            <select v-model="selectedType" @change="handleTypeFilter" class="filter-select">
                <option value="">Todos los tipos</option>
                <option v-for="type in pokemonStore.types" :key="type.name" :value="type.name">
                    {{ typeTranslations[type.name] || type.name }}
                </option>
            </select>
            <select v-model="selectedGeneration" @change="handleGenFilter" class="filter-select">
                <option value="">Todas las regiones</option>
                <option v-for="gen in pokemonStore.generations" :key="gen.name" :value="gen.name">
                    {{ regionTranslations[gen.name] || gen.name }}
                </option>
            </select>
        </div>

        <div v-if="pokemonStore.loading" class="loading">
            <div class="spinner"></div>
        </div>

        <div v-else-if="pokemonStore.error" class="error">
            {{ pokemonStore.error }}
        </div>

        <div v-else class="grid">
            <PokemonCard 
                v-for="pokemon in pokemonStore.pokemonList" 
                :key="pokemon.id" 
                :pokemon="pokemon"
                @click="goToDetails(pokemon.id)"
            />
        </div>
    </div>
</template>

<style scoped>
.home-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.filters {
    padding: 1.5rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
}

.search-input {
    flex: 1;
    min-width: 200px;
}

.filter-select {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--glass-border);
    padding: 10px;
    border-radius: 8px;
    color: white;
    cursor: pointer;
}

.filter-select option {
    background: #1a202c;
    color: white;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2rem;
}

.loading {
    display: flex;
    justify-content: center;
    padding: 4rem;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255,255,255,0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error {
    text-align: center;
    color: #ff4d4d;
    font-size: 1.2rem;
}

/* Mobile Responsive */
@media (max-width: 600px) {
    .filters {
        flex-direction: column;
        align-items: stretch;
    }
    .search-input, .filter-select {
        width: 100%;
    }
    .home-container {
        padding: 1rem;
    }
}
</style>
