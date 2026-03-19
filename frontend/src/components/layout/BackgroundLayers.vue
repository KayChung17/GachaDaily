<script setup lang="ts">
defineProps<{
  activePage: "tasks" | "cards" | "settings";
  themeMode: "minimal" | "gorgeous";
}>();
</script>

<template>
  <div
    id="bg-tasks"
    class="global-bg"
    :class="{ 'is-active': themeMode !== 'minimal' && activePage === 'tasks' }"
    style="background-image: url('/img/input_file_1.png')"
  ></div>
  <div
    id="bg-cards"
    class="global-bg"
    :class="{ 'is-active': themeMode !== 'minimal' && activePage === 'cards' }"
    style="background-image: url('/img/input_file_4.png')"
  ></div>
  <div
    id="bg-settings"
    class="global-bg"
    :class="{ 'is-active': themeMode !== 'minimal' && activePage === 'settings' }"
    style="background-image: url('/img/input_file_6.png')"
  ></div>
  <div
    id="bg-minimal"
    class="global-bg"
    :class="{ 'is-active': themeMode === 'minimal' }"
    style="background-image: url('/img/input_file_0.png')"
  ></div>
</template>
