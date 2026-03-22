<script setup>
import NavBar from './components/NavBar.vue';
import BattleNotification from './components/BattleNotification.vue';
import FriendRequestNotification from './components/FriendRequestNotification.vue';
</script>

<template>
  <NavBar />
  <BattleNotification />
  <FriendRequestNotification />
  <router-view></router-view>
</template>

<style scoped>
</style>
