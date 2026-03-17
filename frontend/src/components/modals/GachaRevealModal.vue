<script setup lang="ts">
import { computed } from "vue";

import { useAppStore } from "../../store/appStore";

const store = useAppStore();
const gachaRevealOpen = computed(() => store.gachaModule.gachaRevealOpen.value);
const gachaRevealImage = computed(() => store.gachaModule.gachaRevealImage.value);
const gachaRevealName = computed(() => store.gachaModule.gachaRevealName.value);
const gachaRevealSpinning = computed(() => store.gachaModule.gachaRevealSpinning.value);
</script>

<template>
  <section
    class="gacha-reveal-modal"
    :class="{ 'is-open': gachaRevealOpen }"
    @click.self="store.gachaModule.closeGachaReveal"
  >
    <div class="gacha-reveal-stage">
      <button
        class="gacha-reveal-close"
        type="button"
        aria-label="关闭抽卡结果"
        @click="store.gachaModule.closeGachaReveal"
      >
        ×
      </button>
      <img
        class="gacha-reveal-image"
        :class="{ 'is-spinning': gachaRevealSpinning }"
        :src="gachaRevealImage"
        alt="抽卡结果"
      />
      <div class="gacha-reveal-name">{{ gachaRevealName }}</div>
    </div>
  </section>
</template>
