<script setup lang="ts">
defineProps<{
  activePage: "tasks" | "cards" | "settings";
}>();

const emit = defineEmits<{
  (event: "change-page", page: "tasks" | "cards" | "settings"): void;
}>();
</script>

<template>
  <nav class="bottom-bar glass-effect" aria-label="页面切换">
    <button
      class="bottom-bar__item"
      :class="{ 'is-active': activePage === 'tasks' }"
      type="button"
      @click="emit('change-page', 'tasks')"
    >
      <span class="diamond nav-icon">◆</span> 任务
    </button>
    <div class="nav-separator"></div>
    <button
      class="bottom-bar__item"
      :class="{ 'is-active': activePage === 'cards' }"
      type="button"
      @click="emit('change-page', 'cards')"
    >
      <span class="diamond nav-icon">◆</span> 卡面
    </button>
    <div class="nav-separator"></div>
    <button
      class="bottom-bar__item"
      :class="{ 'is-active': activePage === 'settings' }"
      type="button"
      @click="emit('change-page', 'settings')"
    >
      <span class="diamond nav-icon">◆</span> 设置
    </button>
  </nav>
</template>
