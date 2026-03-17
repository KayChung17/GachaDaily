<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";

import BackgroundLayers from "./components/layout/BackgroundLayers.vue";
import BottomNav from "./components/layout/BottomNav.vue";
import TopBanner from "./components/layout/TopBanner.vue";
import CardGalleryModal from "./components/modals/CardGalleryModal.vue";
import GachaRevealModal from "./components/modals/GachaRevealModal.vue";
import CardsPage from "./components/pages/CardsPage.vue";
import SettingsPage from "./components/pages/SettingsPage.vue";
import TasksPage from "./components/pages/TasksPage.vue";
import { provideAppStore } from "./store/appStore";

const envApiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isLocalDevHost =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBase = envApiBase || (isLocalDevHost ? "http://127.0.0.1:8056" : "");

const store = provideAppStore(apiBase);
const activePage = computed(() => store.activePage.value);
const themeMode = computed(() => store.themeMode.value);

onMounted(() => {
  document.addEventListener("keydown", store.handleGlobalEscape);
});

onUnmounted(() => {
  document.removeEventListener("keydown", store.handleGlobalEscape);
});
</script>

<template>
  <div class="gacha-daily-app">
    <BackgroundLayers :active-page="activePage" :theme-mode="themeMode" />
    <div class="bg-grid"></div>

    <TopBanner />

    <main class="pages">
      <section class="page" data-page="tasks" :class="{ 'is-active': activePage === 'tasks' }">
        <TasksPage />
      </section>

      <section class="page" data-page="cards" :class="{ 'is-active': activePage === 'cards' }">
        <CardsPage />
      </section>

      <section
        class="page"
        data-page="settings"
        :class="{ 'is-active': activePage === 'settings' }"
      >
        <SettingsPage />
      </section>
    </main>

    <CardGalleryModal />
    <GachaRevealModal />

    <BottomNav :active-page="activePage" @change-page="store.setActivePage" />
  </div>
</template>
