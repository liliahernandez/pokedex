import { defineStore } from 'pinia';
import api from '../services/api';

export const usePokemonStore = defineStore('pokemon', {
    state: () => ({
        pokemonList: [],
        currentPokemon: null,
        nextPage: null,
        previousPage: null,
        loading: false,
        error: null,
        generations: [],
        types: []
    }),
    actions: {
        async fetchPokemonList(limit = 2000, offset = 0) {
            this.loading = true;
            try {
                const response = await api.get(`/pokemon?limit=${limit}&offset=${offset}`);
                this.pokemonList = response.data.results;
                this.nextPage = response.data.next;
                this.previousPage = response.data.previous;
            } catch (error) {
                this.error = 'Failed to fetch Pokemon';
            } finally {
                this.loading = false;
            }
        },
        async fetchPokemonDetails(id) {
            this.loading = true;
            try {
                const response = await api.get(`/pokemon/${id}`);
                this.currentPokemon = response.data;
            } catch (error) {
                this.error = 'Failed to fetch Pokemon details';
            } finally {
                this.loading = false;
            }
        },
        async searchPokemon(name) {
            this.loading = true;
            try {
                const response = await api.get(`/pokemon/search?name=${name}`);
                this.pokemonList = [response.data]; // Show single result
            } catch (error) {
                this.error = 'Pokemon not found';
                this.pokemonList = [];
            } finally {
                this.loading = false;
            }
        },
        async fetchTypes() {
            try {
                const response = await api.get('/pokemon/types');
                this.types = response.data.types;
            } catch (error) {
                console.error(error);
            }
        },
        async fetchGenerations() {
            try {
                const response = await api.get('/pokemon/generations');
                this.generations = response.data.generations;
            } catch (error) {
                console.error(error);
            }
        },
        async filterByType(type1, type2) {
            this.loading = true;
            try {
                let fullList = [];
                
                if (type1 && type2) {
                    const [res1, res2] = await Promise.all([
                        api.get(`/pokemon/type/${type1}`),
                        api.get(`/pokemon/type/${type2}`)
                    ]);
                    const names2 = res2.data.pokemon.map(p => p.name);
                    fullList = res1.data.pokemon.filter(p => names2.includes(p.name));
                } else {
                    const activeType = type1 || type2;
                    const response = await api.get(`/pokemon/type/${activeType}`);
                    fullList = response.data.pokemon;
                }

                this.pokemonList = fullList.map(p => {
                    const id = p.url.split('/').filter(Boolean).pop();
                    return {
                        id,
                        name: p.name,
                        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
                        types: [type1, type2].filter(Boolean)
                    };
                });
            } catch (error) {
                this.error = 'Failed to filter by types';
            } finally {
                this.loading = false;
            }
        },
        async filterByGeneration(generation) {
            this.loading = true;
            try {
                const response = await api.get(`/pokemon/generation/${generation}`);
                this.pokemonList = response.data.pokemon.map(p => ({
                    name: p.name,
                    url: p.url
                }));
                this.pokemonList = this.pokemonList.map(p => {
                    const id = p.url.split('/').filter(Boolean).pop();
                    return {
                        id,
                        name: p.name,
                        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
                        types: []
                    }
                });
            } catch (error) {
                this.error = 'Failed to filter by generation';
            } finally {
                this.loading = false;
            }
        }
    }
});
