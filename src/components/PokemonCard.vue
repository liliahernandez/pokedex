<script setup>
import { computed } from 'vue';

const props = defineProps({
  pokemon: {
    type: Object,
    required: true
  }
});

const typeColors = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  steel: '#B7B7CE',
  fairy: '#D685AD'
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

const getGradient = (types) => {
    if (!types || types.length === 0) return 'linear-gradient(135deg, #777, #999)';
    const color1 = typeColors[types[0]] || '#777';
    const color2 = types[1] ? typeColors[types[1]] : color1;
    return `linear-gradient(135deg, ${color1}cc, ${color2}cc)`;
};

const mainTypeColor = computed(() => {
    return props.pokemon.types && props.pokemon.types.length > 0 
        ? typeColors[props.pokemon.types[0]] 
        : '#777';
});
</script>

<template>
  <div class="pokemon-card glass-panel" :style="{ borderColor: mainTypeColor }">
    <div class="image-container" :style="{ background: getGradient(pokemon.types) }">
        <img :src="pokemon.sprite || pokemon.sprites?.front_default" :alt="pokemon.name" loading="lazy" />
    </div>
    <div class="info">
        <span class="number">#{{ pokemon.id }}</span>
        <h3>{{ pokemon.name }}</h3>
        <div class="types">
            <span v-for="type in pokemon.types" :key="type" class="type-badge" :style="{ backgroundColor: typeColors[type] }">
                {{ typeTranslations[type] || type }}
            </span>
        </div>
    </div>
  </div>
</template>

<style scoped>
.pokemon-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  border-width: 1px;
  border-style: solid;
}

.pokemon-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
}

.image-container {
    height: 150px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.image-container img {
    width: 120px;
    height: 120px;
    object-fit: contain;
    z-index: 1;
    transition: transform 0.3s;
}

.pokemon-card:hover img {
    transform: scale(1.1);
}

.info {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.number {
    font-size: 0.8rem;
    color: #a0aec0;
    font-weight: 600;
}

h3 {
    margin: 0;
    text-transform: capitalize;
    font-size: 1.25rem;
    color: white;
}

.types {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.type-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    text-transform: capitalize;
}
</style>
