<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

import { useAppStore } from "../../store/appStore";
import type { ThemeMode } from "../../types/domain";

const store = useAppStore();
const syncStatus = computed(() => store.syncModule.syncStatus.value);

const themeLabels: Record<ThemeMode, string> = {
  gorgeous: "华丽",
  minimal: "简约",
};

const themeOpen = ref(false);
const themePickerRef = ref<HTMLElement | null>(null);

const themeLabel = computed(
  () => themeLabels[store.state.settings.themeMode] || themeLabels.gorgeous
);

function selectTheme(theme: ThemeMode): void {
  store.state.settings.themeMode = theme;
  themeOpen.value = false;
}

function toggleTheme(open: boolean = !themeOpen.value): void {
  themeOpen.value = open;
}

function closeThemeOnOutsideClick(event: MouseEvent): void {
  if (!themeOpen.value || !themePickerRef.value) return;
  const target = event.target as Node | null;
  if (target && !themePickerRef.value.contains(target)) {
    themeOpen.value = false;
  }
}

function closeThemeOnEscape(event: KeyboardEvent): void {
  if (event.key === "Escape" && themeOpen.value) {
    themeOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", closeThemeOnOutsideClick);
  document.addEventListener("keydown", closeThemeOnEscape);
});

onUnmounted(() => {
  document.removeEventListener("click", closeThemeOnOutsideClick);
  document.removeEventListener("keydown", closeThemeOnEscape);
});
</script>

<template>
  <section class="chiseled-panel glass-panel">
    <div class="panel-inner">
      <div class="panel__header">
        <h2><span class="diamond">◆</span> 配 置 <span class="diamond">◆</span></h2>
        <p>配置 RSS 与数据同步</p>
      </div>

      <div class="form-group">
        <label>主题模式</label>
        <div ref="themePickerRef" class="theme-picker">
          <div class="input-wrapper glass-input">
            <button class="date-picker__button" type="button" @click="toggleTheme()">
              <span>{{ themeLabel }}</span>
              <span class="diamond small">◆</span>
            </button>
            <span class="input-line"></span>
          </div>
          <div class="theme-panel chiseled-panel" :class="{ 'is-open': themeOpen }">
            <div class="panel-inner">
              <div class="theme-options">
                <button
                  type="button"
                  class="theme-option"
                  :class="{ 'is-selected': store.state.settings.themeMode === 'gorgeous' }"
                  @click="selectTheme('gorgeous')"
                >
                  华丽
                </button>
                <button
                  type="button"
                  class="theme-option"
                  :class="{ 'is-selected': store.state.settings.themeMode === 'minimal' }"
                  @click="selectTheme('minimal')"
                >
                  简约
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>RSS 地址（目前仅支持解析pixiv）</label>
        <div class="input-wrapper glass-input">
          <input v-model="store.state.settings.rssUrl" type="url" placeholder="/api/rss" />
          <span class="input-line"></span>
        </div>
      </div>
      <div class="settings-actions">
        <button class="btn btn--hollow" type="button" @click="store.rssModule.syncRssToPool">
          同步 RSS 到卡池
        </button>
        <span class="hint-text">※ 默认走 FastAPI 的 /api/rss 代理</span>
      </div>

      <hr class="cyber-divider" />

      <div class="panel__header small">
        <h3><span class="diamond">◆</span> 数 据 同 步 <span class="diamond">◆</span></h3>
        <p>与本地/远程同步服务交换数据</p>
      </div>

      <div class="task-form__row">
        <div class="form-group flex-1">
          <label>同步地址 (Sync URL)</label>
          <div class="input-wrapper glass-input">
            <input v-model="store.state.settings.syncUrl" type="url" placeholder="/api/sync" />
            <span class="input-line"></span>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button class="btn btn--outline" type="button" @click="store.syncModule.syncPull">拉取</button>
        <button class="btn btn--outline" type="button" @click="store.syncModule.syncPush">上传</button>
        <span class="hint-text">{{ syncStatus }}</span>
      </div>
    </div>
  </section>
</template>
