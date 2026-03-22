<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '../stores/user';
import PokemonCard from '../components/PokemonCard.vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

onMounted(() => {
    userStore.fetchFavorites();
});

const goToDetails = (id) => {
    router.push(`/pokemon/${id}`);
};
</script>

<template>
    <div class="favorites-container">
        <h1>Mis Favoritos</h1>
        <div v-if="userStore.favorites.length === 0" class="empty-state glass-panel">
            <p>¡No has añadido favoritos aún!</p>
            <router-link to="/" class="btn">Explorar Pokemon</router-link>
        </div>
        <div class="grid">
            <PokemonCard 
                v-for="fav in userStore.favorites" 
                :key="fav.pokemonId" 
                :pokemon="{ id: fav.pokemonId, ...fav }"
                @click="goToDetails(fav.pokemonId)"
            />
        </div>
    </div>
</template>

<style scoped>
.favorites-container {
    padding: 1rem;
}

h1 {
    margin-bottom: 2rem;
    color: var(--secondary-color);
}

.empty-state {
    text-align: center;
    padding: 3rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2rem;
}

.btn {
    display: inline-block;
    margin-top: 1rem;
    text-decoration: none;
}
</style>
