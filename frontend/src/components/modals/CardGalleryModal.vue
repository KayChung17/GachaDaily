<script setup lang="ts">
import { computed } from "vue";

import { useAppStore } from "../../store/appStore";

const store = useAppStore();
const displayCards = computed(() => store.gachaModule.displayCards.value);
const cardGalleryOpen = computed(() => store.gachaModule.cardGalleryOpen.value);
const cardZoomOpen = computed(() => store.gachaModule.cardZoomOpen.value);
const cardZoomImage = computed(() => store.gachaModule.cardZoomImage.value);
const cardZoomName = computed(() => store.gachaModule.cardZoomName.value);
</script>

<template>
  <section
    class="card-gallery-modal"
    :class="{ 'is-open': cardGalleryOpen }"
    @click.self="store.gachaModule.closeCardGallery"
  >
    <div class="card-gallery-shell chiseled-panel glass-panel">
      <div class="panel-inner">
        <div class="panel__header">
          <h2><span class="diamond">◆</span> 卡 面 展 示 墙 <span class="diamond">◆</span></h2>
          <p>已获得卡面</p>
        </div>

        <div class="card-wall">
          <div v-if="!displayCards.length" class="note-box">还没有卡面，小资历真丢人啊</div>
          <template v-else>
            <div
              v-for="card in displayCards"
              :key="card.id"
              class="card-item"
              @click="store.gachaModule.openCardZoom(card.imageUrl, card.name || '卡面大图')"
            >
              <img :src="card.imageUrl" :alt="card.name" />
              <div class="rarity-tag" :class="`rarity-${card.rarity}`"><span>{{ card.rarity }}</span></div>
              <div class="card-item__body">
                <div class="card-item__title">{{ card.name }}</div>
              </div>
            </div>
          </template>
        </div>

        <div class="card-zoom" :class="{ 'is-open': cardZoomOpen }" @click.self="store.gachaModule.closeCardZoom">
          <button class="card-zoom-close" type="button" aria-label="关闭大图" @click="store.gachaModule.closeCardZoom">
            ×
          </button>
          <img class="card-zoom-image" :src="cardZoomImage" :alt="cardZoomName" />
        </div>
      </div>
    </div>
  </section>
</template>
