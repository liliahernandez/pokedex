<script setup>
import { onMounted, ref, watch } from 'vue';
import { usePokemonStore } from '../stores/pokemon';
import PokemonCard from '../components/PokemonCard.vue';
import { useRouter } from 'vue-router';

const pokemonStore = usePokemonStore();
const router = useRouter();

const searchQuery = ref('');
const selectedRegion = ref('');
const selectedGeneration = ref('');
const selectedType1 = ref('');
const selectedType2 = ref('');

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
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', steel: 'Acero', fairy: 'Hada'
};

onMounted(() => {
    pokemonStore.fetchPokemonList();
    pokemonStore.fetchTypes();
    pokemonStore.fetchGenerations();
});

const handleSearch = () => {
    selectedType1.value = '';
    selectedType2.value = '';
    selectedRegion.value = '';
    selectedGeneration.value = '';
    if (searchQuery.value) {
        pokemonStore.searchPokemon(searchQuery.value);
    } else {
        pokemonStore.fetchPokemonList();
    }
};

const handleTypeFilter = () => {
    selectedRegion.value = '';
    selectedGeneration.value = '';
    searchQuery.value = '';
    if (selectedType1.value || selectedType2.value) {
        pokemonStore.filterByType(selectedType1.value, selectedType2.value);
    } else {
        pokemonStore.fetchPokemonList();
    }
};

const handleGenFilter = () => {
    selectedType1.value = '';
    selectedType2.value = '';
    searchQuery.value = '';
    // Unify region and generation since they refer to the exact same PokeAPI generation value
    const finalGen = selectedRegion.value || selectedGeneration.value;
    
    // If one is selected, mirror the other if needed or just use active
    if (selectedRegion.value) selectedGeneration.value = selectedRegion.value;
    else if (selectedGeneration.value) selectedRegion.value = selectedGeneration.value;

    if (finalGen) {
        pokemonStore.filterByGeneration(finalGen);
    } else {
        pokemonStore.fetchPokemonList();
    }
};

const goToDetails = (id) => {
    router.push(`/pokemon/${id}`);
};
</script>

<template>
    <div class="home-container">
        <div class="filters glass-panel">
            <div class="filter-row top-row">
                <input 
                    v-model="searchQuery" 
                    @keyup.enter="handleSearch" 
                    placeholder="Buscar Pokemon..." 
                    class="search-input"
                />
                <select v-model="selectedRegion" @change="handleGenFilter" class="filter-select">
                    <option value="">Todas las Regiones</option>
                    <option v-for="gen in pokemonStore.generations" :key="'reg-'+gen.name" :value="gen.name">
                        {{ regionTranslations[gen.name] || gen.name.toUpperCase() }}
                    </option>
                </select>
            </div>
            <div class="filter-row bottom-row">
                <select v-model="selectedGeneration" @change="handleGenFilter" class="filter-select">
                    <option value="">Todas las Generaciones</option>
                    <option v-for="(gen, index) in pokemonStore.generations" :key="'gen-'+gen.name" :value="gen.name">
                        Generación {{ index + 1 }}
                    </option>
                </select>
                <select v-model="selectedType1" @change="handleTypeFilter" class="filter-select">
                    <option value="">Tipo 1</option>
                    <option v-for="type in pokemonStore.types" :key="'t1-'+type.name" :value="type.name">
                        {{ typeTranslations[type.name] || type.name }}
                    </option>
                </select>
                <select v-model="selectedType2" @change="handleTypeFilter" class="filter-select">
                    <option value="">Tipo 2</option>
                    <option v-for="type in pokemonStore.types" :key="'t2-'+type.name" :value="type.name">
                        {{ typeTranslations[type.name] || type.name }}
                    </option>
                </select>
            </div>
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
    flex-direction: column;
    gap: 1rem;
}

.filter-row {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.top-row {
    flex-wrap: wrap;
}
.bottom-row {
    flex-wrap: wrap;
}

.search-input {
    flex: 2;
    min-width: 200px;
}

.filter-select {
    flex: 1;
    min-width: 130px;
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
    .filter-row {
        flex-direction: row;
        align-items: center;
        flex-wrap: nowrap;
        gap: 0.5rem;
        width: 100%;
    }
    
    .top-row .search-input {
        width: auto;
        flex: 1.5;
        min-width: 0;
    }
    .top-row .filter-select {
        width: auto;
        flex: 1;
        min-width: 0;
        padding: 8px 4px;
        font-size: 0.85rem;
    }

    .bottom-row .filter-select {
        padding: 8px 2px;
        font-size: 0.75rem;
        min-width: 0;
        flex: 1;
    }

    .filters {
        padding: 1rem;
    }

    .home-container {
        padding: 1rem;
    }
}
</style>
