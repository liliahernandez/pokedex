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
const selectedPokemonIds = ref([]);
const addingPokemonId = ref('');

onMounted(() => {
    userStore.fetchTeams();
});

const openCreateModal = () => {
    teamName.value = '';
    selectedPokemonIds.value = [];
    showingCreateModal.value = true;
};

const openEditModal = (team) => {
    editingTeamId.value = team.id;
    teamName.value = team.name;
    selectedPokemonIds.value = team.pokemon.map(p => p.pokemonId);
    showingEditModal.value = true;
};

const createTeam = async () => {
    if (!teamName.value || selectedPokemonIds.value.length === 0) return;
    await userStore.createTeam(teamName.value, selectedPokemonIds.value);
    showingCreateModal.value = false;
};

const updateTeam = async () => {
    if (!editingTeamId.value || !teamName.value) return;
    await userStore.updateTeam(editingTeamId.value, teamName.value, selectedPokemonIds.value);
    showingEditModal.value = false;
};

const deleteTeam = async (id) => {
    if(confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
        await userStore.deleteTeam(id);
    }
};

const addPokemonToSelection = () => {
    if (addingPokemonId.value) {
        selectedPokemonIds.value.push(parseInt(addingPokemonId.value));
        addingPokemonId.value = '';
    }
};

const removePokemonFromSelection = (index) => {
    selectedPokemonIds.value.splice(index, 1);
};
</script>

<template>
    <div class="teams-container">
        <div class="header">
            <h1>Mis Equipos</h1>
            <button class="btn" @click="openCreateModal">+ Crear Equipo</button>
        </div>

        <!-- Create/Edit Modal (Reused structure or copied for simplicity) -->
        <div v-if="showingCreateModal || showingEditModal" class="modal-overlay">
            <div class="modal glass-panel">
                <h2>{{ showingEditModal ? 'Editar Equipo' : 'Nuevo Equipo' }}</h2>
                <input v-model="teamName" placeholder="Nombre del Equipo" class="input-field" />
                
                <div class="pokemon-selector">
                    <input v-model="addingPokemonId" type="number" placeholder="ID de Pokemon" class="input-field" />
                    <button type="button" class="btn small" @click="addPokemonToSelection">Añadir</button>
                </div>
                
                <div class="selected-list">
                    <div v-for="(id, index) in selectedPokemonIds" :key="index" class="selected-item">
                        <span class="badge">#{{ id }}</span>
                        <span class="remove-x" @click="removePokemonFromSelection(index)">×</span>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn" @click="showingEditModal ? updateTeam() : createTeam()">Guardar</button>
                    <button class="btn secondary" @click="showingCreateModal = false; showingEditModal = false">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="teams-grid">
            <div v-for="team in userStore.teams" :key="team.id" class="team-card glass-panel">
                <div class="team-header">
                    <h3>{{ team.name }}</h3>
                    <div class="header-actions">
                        <span class="count">{{ team.pokemon.length }} / 6</span>
                        <button class="btn-icon" title="Editar" @click="openEditModal(team)">✏️</button>
                        <button class="btn-icon" title="Eliminar" @click="deleteTeam(team.id)">🗑</button>
                    </div>
                </div>
                <div class="team-roster">
                    <div v-for="p in team.pokemon" :key="p.pokemonId" class="mini-sprite">
                        <img :src="p.sprite" :title="p.name" />
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
    background: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.modal {
    padding: 2rem;
    width: 400px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.input-field {
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
}

/* Hide number input spinners */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  appearance: none;
  margin: 0; 
}
input[type=number] {
    -moz-appearance: textfield;
    appearance: none;
}

.pokemon-selector {
    display: flex;
    gap: 0.5rem;
}

.btn.small {
    padding: 0.5rem 1rem;
}

.selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    min-height: 50px;
    background: rgba(0,0,0,0.2);
    padding: 0.5rem;
    border-radius: 8px;
}

.selected-item {
    display: flex;
    align-items: center;
    background: var(--primary-color);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.9rem;
}

.remove-x {
    margin-left: 5px;
    cursor: pointer;
    font-weight: bold;
}

.remove-x:hover {
    color: black;
}

.team-card {
    padding: 1.5rem;
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

.btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.25rem;
    transition: transform 0.2s;
}

.btn-icon:hover {
    transform: scale(1.2);
}

.team-roster {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.mini-sprite {
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mini-sprite img {
    width: 30px;
    height: 30px;
}
</style>
