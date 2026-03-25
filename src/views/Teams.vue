<script setup>
import { onMounted, ref } from 'vue';
import { useUserStore } from '../stores/user';
import { usePokemonStore } from '../stores/pokemon';

const userStore = useUserStore();
const pokemonStore = usePokemonStore();

const showingCreateModal = ref(false);
const showingEditModal = ref(false);
const editingTeamId = ref(null);

const teamName = ref('');
const selectedPokemonData = ref([]); // Array of { pokemonId, name, sprite, moves }

// Temporary state for the modal search
const searchPokeQuery = ref('');
const tempPokemon = ref(null);
const searchError = ref('');

onMounted(() => {
    userStore.fetchTeams();
});

const openCreateModal = () => {
    teamName.value = '';
    selectedPokemonData.value = [];
    resetSearch();
    showingCreateModal.value = true;
};

const openEditModal = (team) => {
    editingTeamId.value = team.id || team._id;
    teamName.value = team.name;
    selectedPokemonData.value = team.pokemon.map(p => ({
        pokemonId: p.pokemonId,
        name: p.name,
        sprite: p.sprite,
        moves: p.moves || []
    }));
    resetSearch();
    showingEditModal.value = true;
};

const resetSearch = () => {
    searchPokeQuery.value = '';
    tempPokemon.value = null;
    searchError.value = '';
};

const searchPokemonForTeam = async () => {
    if (!searchPokeQuery.value) return;
    searchError.value = '';
    tempPokemon.value = null;
    try {
        await pokemonStore.fetchPokemonDetails(searchPokeQuery.value.toLowerCase());
        const p = pokemonStore.currentPokemon;
        if (p) {
            tempPokemon.value = {
                pokemonId: p.id,
                name: p.name,
                sprite: p.sprites?.front_default || p.sprites?.other?.['official-artwork']?.front_default,
                availableMoves: p.moves.map(m => m.name),
                selectedMoves: []
            };
        } else {
            searchError.value = 'Pokémon no encontrado';
        }
    } catch(err) {
        searchError.value = 'Pokémon no encontrado';
    }
};

const addTempPokemonToTeam = () => {
    if (!tempPokemon.value) return;
    if (selectedPokemonData.value.length >= 6) {
        alert("Un equipo solo puede tener 6 Pokémon");
        return;
    }
    
    selectedPokemonData.value.push({
        pokemonId: tempPokemon.value.pokemonId,
        name: tempPokemon.value.name,
        sprite: tempPokemon.value.sprite,
        moves: [...tempPokemon.value.selectedMoves]
    });
    
    resetSearch();
};

const removePokemonFromSelection = (index) => {
    selectedPokemonData.value.splice(index, 1);
};

const createTeam = async () => {
    if (!teamName.value || selectedPokemonData.value.length === 0) return;
    await userStore.createTeam(teamName.value, selectedPokemonData.value);
    showingCreateModal.value = false;
};

const updateTeam = async () => {
    if (!editingTeamId.value || !teamName.value) return;
    await userStore.updateTeam(editingTeamId.value, teamName.value, selectedPokemonData.value);
    showingEditModal.value = false;
};

const deleteTeam = async (id) => {
    if(confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
        await userStore.deleteTeam(id);
    }
};
</script>

<template>
    <div class="teams-container">
        <div class="header">
            <h1>Mis Equipos</h1>
            <button class="btn" @click="openCreateModal">+ Crear Equipo</button>
        </div>

        <!-- Create/Edit Modal -->
        <div v-if="showingCreateModal || showingEditModal" class="modal-overlay" @click.self="showingCreateModal=false; showingEditModal=false">
            <div class="modal glass-panel wide-modal">
                <h2>{{ showingEditModal ? 'Editar Equipo' : 'Nuevo Equipo' }}</h2>
                <input v-model="teamName" placeholder="Nombre del Equipo" class="input-field" maxlength="25" />
                
                <h3 class="section-title">Añadir Pokémon (Máx 6)</h3>
                <div class="pokemon-search-area">
                    <div class="search-box">
                        <input v-model="searchPokeQuery" @keyup.enter="searchPokemonForTeam" type="text" placeholder="ID o Nombre (ej: pikachu)" class="input-field" />
                        <button type="button" class="btn small search-btn" @click="searchPokemonForTeam">🔍 Buscar</button>
                    </div>
                    <span v-if="searchError" class="error-msg">{{ searchError }}</span>
                    
                    <!-- Formulario de Selección de Movimientos -->
                    <div v-if="tempPokemon" class="move-selector-box">
                        <div class="poke-preview">
                            <img :src="tempPokemon.sprite" />
                            <strong>{{ tempPokemon.name.toUpperCase() }}</strong>
                        </div>
                        <div class="moves-container">
                            <p>Selecciona Movimientos ({{ tempPokemon.selectedMoves.length }}/5):</p>
                            <div class="moves-list">
                                <label v-for="move in tempPokemon.availableMoves" :key="move" class="move-label" :class="{'selected': tempPokemon.selectedMoves.includes(move), 'disabled': tempPokemon.selectedMoves.length >= 5 && !tempPokemon.selectedMoves.includes(move)}">
                                    <input type="checkbox" :value="move" v-model="tempPokemon.selectedMoves" :disabled="tempPokemon.selectedMoves.length >= 5 && !tempPokemon.selectedMoves.includes(move)" class="hidden-check">
                                    {{ move }}
                                </label>
                            </div>
                        </div>
                        <button class="btn small add-btn" @click="addTempPokemonToTeam">Agregar a la Lista</button>
                    </div>
                </div>
                
                <h3 class="section-title">Pokémon en tu Equipo ({{ selectedPokemonData.length }}/6)</h3>
                <div class="selected-grid">
                    <div v-for="(p, index) in selectedPokemonData" :key="index" class="selected-card">
                        <span class="remove-x" @click="removePokemonFromSelection(index)">×</span>
                        <img :src="p.sprite" class="card-sprite"/>
                        <p class="card-name">{{ p.name }}</p>
                        <div class="card-moves">
                            <span v-for="m in p.moves.slice(0,5)" :key="m" class="move-badge">{{ m }}</span>
                            <span v-if="p.moves.length === 0" class="no-moves">Sin movimientos</span>
                        </div>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn save-btn" @click="showingEditModal ? updateTeam() : createTeam()">Guardar Equipo</button>
                    <button class="btn secondary" @click="showingCreateModal = false; showingEditModal = false">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="teams-grid">
            <div v-for="team in userStore.teams" :key="team.id || team._id" class="team-card glass-panel">
                <div class="team-header">
                    <h3>{{ team.name }}</h3>
                    <div class="header-actions">
                        <span class="count">{{ team.pokemon.length }} / 6</span>
                        <button class="btn-icon ext" title="Editar" @click="openEditModal(team)">✏️</button>
                        <button class="btn-icon ext" title="Eliminar" @click="deleteTeam(team.id || team._id)">🗑</button>
                    </div>
                </div>
                <!-- Vista tipo Grid para mostrar los movimientos configurados -->
                <div class="roster-grid">
                    <div v-for="p in team.pokemon" :key="p.pokemonId" class="roster-item">
                        <div class="roster-img-container">
                            <img :src="p.sprite" :title="p.name" />
                        </div>
                        <p class="roster-name">{{ p.name }}</p>
                        <div class="roster-moves">
                            <span v-for="m in p.moves.slice(0,5)" :key="'m-'+m">{{ m }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.teams-container {
    padding: 1rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow-y: auto;
    z-index: 1000;
    padding: 2rem 1rem;
}

.modal {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.wide-modal {
    width: 600px;
    max-width: 100%;
}

.section-title {
    font-size: 1.1rem;
    border-bottom: 1px solid var(--glass-border);
    padding-bottom: 0.5rem;
    margin-top: 1rem;
}

.input-field {
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
}

.pokemon-search-area {
    background: rgba(0,0,0,0.2);
    padding: 1rem;
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.search-box {
    display: flex;
    gap: 0.5rem;
}

.search-box .input-field {
    flex: 1;
}

.search-btn {
    white-space: nowrap;
}

.error-msg {
    color: #ef4444;
    font-size: 0.85rem;
}

.move-selector-box {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: rgba(255,255,255,0.05);
    padding: 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-highlight);
}

.poke-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.poke-preview img {
    width: 60px;
    height: 60px;
    background: rgba(0,0,0,0.3);
    border-radius: 50%;
}

.moves-container p {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: var(--primary-color);
}

.moves-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    max-height: 150px;
    overflow-y: auto;
    padding: 0.5rem;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
}

.move-label {
    background: rgba(255,255,255,0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    border: 1px solid transparent;
}

.move-label:hover:not(.disabled) {
    background: rgba(255,255,255,0.2);
}

.move-label.selected {
    background: var(--primary-color);
    color: #121212;
    font-weight: bold;
    border-color: #fff;
}

.move-label.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.hidden-check {
    display: none;
}

.add-btn {
    align-self: flex-end;
    background: #4ade80;
    color: #000;
}

.selected-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    min-height: 100px;
}

.selected-card {
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    padding: 1rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    border: 1px solid var(--glass-border);
}

.remove-x {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ef4444;
    color: white;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    z-index: 2;
}

.card-sprite {
    width: 60px;
    height: 60px;
}

.card-name {
    font-weight: bold;
    font-size: 0.9rem;
    margin: 0.5rem 0;
    text-transform: capitalize;
}

.card-moves {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    justify-content: center;
}

.move-badge {
    background: rgba(34, 211, 238, 0.2);
    color: #22d3ee;
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 8px;
    text-align: center;
    white-space: nowrap;
}

.no-moves {
    font-size: 0.7rem;
    color: #888;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
}

.save-btn {
    background: linear-gradient(135deg, var(--primary-color), #fcd34d);
    color: #000;
}

/* Roster in Team Card */
.team-card {
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.team-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.ext {
    font-size: 1rem;
}

.roster-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 1rem;
}

.roster-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 1rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s;
}

.roster-item:hover {
    transform: translateY(-5px);
    background: rgba(255,255,255,0.08);
}

.roster-img-container {
    background: rgba(0,0,0,0.2);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
}

.roster-img-container img {
    width: 70px;
    height: 70px;
}

.roster-name {
    font-weight: 700;
    font-size: 0.95rem;
    margin: 0 0 0.5rem 0;
    text-transform: capitalize;
}

.roster-moves {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    gap: 0.3rem;
    width: 100%;
}

.roster-moves span {
    font-size: 0.7rem;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 0.2rem;
    text-align: center;
    border-radius: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Mobile Responsive */
.teams-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
}

@media (min-width: 768px) {
    .teams-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
}

@media (max-width: 600px) {
    .header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
    .modal {
        padding: 1.5rem;
    }
    .search-box {
        flex-direction: column;
    }
    .roster-grid {
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    }
}
</style>
