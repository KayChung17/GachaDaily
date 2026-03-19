<script setup lang="ts">
import { computed } from "vue";

import { useAppStore } from "../../store/appStore";

const store = useAppStore();
const isGachaAnimating = computed(() => store.gachaModule.isGachaAnimating.value);
const previewCards = computed(() => store.gachaModule.previewCards.value);
const previewStyle = computed(() => store.gachaModule.previewStyle.value);

function openGalleryByKeyboard(event: KeyboardEvent): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    store.gachaModule.openCardGallery();
  }
}
</script>

<template>
  <div>
    <section class="gacha-top-row">
      <div class="gacha-center">
        <button
          class="gacha-image-btn"
          type="button"
          aria-label="抽卡"
          :disabled="isGachaAnimating"
          @click="store.gachaModule.drawCard"
        >
          <img src="/img/chouka.png" alt="抽卡底图" />
        </button>
      </div>
      <section class="chiseled-panel gacha-points-panel">
        <div class="panel-inner">
          <div class="gacha-points">
            <span class="currency-card__label">当前积分</span>
            <div class="currency-card__value-box">
              <span class="star-icon">✦</span>
              <span class="currency-card__value">{{ store.state.currency }}</span>
            </div>
          </div>
        </div>
      </section>
    </section>

    <section
      class="chiseled-panel glass-panel cards-preview-panel"
      role="button"
      tabindex="0"
      aria-label="打开卡面展示墙"
      @click="store.gachaModule.openCardGallery"
      @keydown="openGalleryByKeyboard"
    >
      <div class="panel-inner">
        <div class="panel__header">
          <h2><span class="diamond">◆</span> 幻 影 回 廊 <span class="diamond">◆</span></h2>
        </div>
        <div
          :ref="store.gachaModule.setPreviewContainer"
          class="card-preview-grid"
          :style="previewStyle"
        >
          <div v-if="!previewCards.length" class="note-box">还没有卡面，小资历真丢人啊</div>
          <template v-else>
            <div v-for="card in previewCards" :key="card.id" class="card-preview-item">
              <img :src="card.imageUrl" :alt="card.name" />
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>
