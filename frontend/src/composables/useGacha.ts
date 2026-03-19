import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";

import type { AppState, CardPoolItem, DrawnCard } from "../types/domain";

const rarityWeights = [
  { rarity: "UR", weight: 3 },
  { rarity: "SSR", weight: 12 },
  { rarity: "SR", weight: 35 },
  { rarity: "R", weight: 50 },
];

function dedupeCardsByImage(cards: DrawnCard[]): DrawnCard[] {
  const seen = new Set<string>();
  const unique: DrawnCard[] = [];

  cards.forEach((card) => {
    const key = (card.imageUrl || "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(card);
  });

  return unique;
}

function chooseRarity(): string {
  const total = rarityWeights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of rarityWeights) {
    if (roll < item.weight) return item.rarity;
    roll -= item.weight;
  }
  return "SR";
}

export function useGacha(state: AppState) {
  const isGachaAnimating = ref(false);

  const cardGalleryOpen = ref(false);
  const cardZoomOpen = ref(false);
  const cardZoomImage = ref("");
  const cardZoomName = ref("卡面大图");

  const gachaRevealOpen = ref(false);
  const gachaRevealImage = ref("/img/chouka.png");
  const gachaRevealName = ref("");
  const gachaRevealSpinning = ref(false);

  const previewContainerRef = ref<HTMLElement | null>(null);
  const previewCols = ref(1);
  const previewCount = ref(1);

  const displayCards = computed(() => dedupeCardsByImage(state.cards));
  const previewCards = computed(() => displayCards.value.slice(0, previewCount.value));
  const previewStyle = computed(() => ({
    "--preview-count": String(displayCards.value.length ? previewCount.value : 1),
    "--preview-cols": String(displayCards.value.length ? previewCols.value : 1),
  }));

  let revealTimer: number | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function updatePreviewLayout(): void {
    const el = previewContainerRef.value;
    if (!el) {
      previewCols.value = 4;
      previewCount.value = 4;
      return;
    }

    const minWidth = 88;
    const gap = 10;
    const ratio = 2 / 3;
    const width = el.clientWidth;
    const height = el.clientHeight;

    if (!width || !height) {
      previewCols.value = 4;
      previewCount.value = 4;
      return;
    }

    const cols = Math.max(1, Math.floor((width + gap) / (minWidth + gap)));
    const itemWidth = (width - (cols - 1) * gap) / cols;
    const itemHeight = itemWidth / ratio;
    const rows = Math.max(1, Math.floor((height + gap) / (itemHeight + gap)));

    previewCols.value = cols;
    previewCount.value = Math.max(1, cols * rows);
  }

  function setPreviewContainer(el: Element | ComponentPublicInstance | null): void {
    previewContainerRef.value = el instanceof HTMLElement ? el : null;
  }

  watch(previewContainerRef, (nextEl, prevEl) => {
    if (resizeObserver && prevEl) {
      resizeObserver.unobserve(prevEl);
    }
    if (resizeObserver && nextEl) {
      resizeObserver.observe(nextEl);
    }
    nextTick(updatePreviewLayout);
  });

  watch(
    () => displayCards.value.length,
    () => {
      nextTick(updatePreviewLayout);
    }
  );

  onMounted(() => {
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updatePreviewLayout();
      });
      if (previewContainerRef.value) {
        resizeObserver.observe(previewContainerRef.value);
      }
    }

    window.addEventListener("resize", updatePreviewLayout);
    nextTick(updatePreviewLayout);
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    window.removeEventListener("resize", updatePreviewLayout);
    if (revealTimer) {
      window.clearTimeout(revealTimer);
    }
  });

  function openCardGallery(): void {
    cardGalleryOpen.value = true;
  }

  function closeCardGallery(): void {
    closeCardZoom();
    cardGalleryOpen.value = false;
  }

  function openCardZoom(imageUrl: string, imageName = "卡面大图"): void {
    cardZoomImage.value = imageUrl;
    cardZoomName.value = imageName;
    cardZoomOpen.value = true;
  }

  function closeCardZoom(): void {
    cardZoomOpen.value = false;
    cardZoomImage.value = "";
    cardZoomName.value = "卡面大图";
  }

  function openGachaReveal(card: DrawnCard): void {
    gachaRevealName.value = "";
    gachaRevealImage.value = "/img/waiting.png";
    gachaRevealOpen.value = true;
    gachaRevealSpinning.value = false;

    nextTick(() => {
      gachaRevealSpinning.value = true;
    });

    if (revealTimer) {
      window.clearTimeout(revealTimer);
    }

    revealTimer = window.setTimeout(() => {
      gachaRevealSpinning.value = false;
      gachaRevealImage.value = card.imageUrl;
      gachaRevealName.value = `${card.rarity} · ${card.name}`;
      isGachaAnimating.value = false;
    }, 2200);
  }

  function closeGachaReveal(): void {
    gachaRevealOpen.value = false;
    gachaRevealSpinning.value = false;
    gachaRevealImage.value = "";
    gachaRevealName.value = "";
    isGachaAnimating.value = false;

    if (revealTimer) {
      window.clearTimeout(revealTimer);
      revealTimer = null;
    }
  }

  function drawCard(): void {
    if (isGachaAnimating.value) return;

    const pool = state.settings.cardPool.filter((card) => card.imageUrl && card.imageUrl.trim());
    if (!pool.length) {
      window.alert("先去同步RSS把老婆们装进卡池啊");
      return;
    }

    const drawnImageSet = new Set(
      state.cards.map((card) => (card.imageUrl || "").trim()).filter(Boolean)
    );

    const availablePool = pool.filter(
      (card) => !drawnImageSet.has((card.imageUrl || "").trim())
    );

    if (!availablePool.length) {
      window.alert("本期卡池真的一滴也不剩了~请前往配置页更新轮换池");
      return;
    }

    if (state.currency < state.settings.gachaCost) {
      window.alert("赶紧滚去<del>打工</del>做任务攒积分");
      return;
    }

    state.currency -= state.settings.gachaCost;
    const rarity = chooseRarity();
    const rarityPool = availablePool.filter((card) => card.rarity === rarity);
    const sourcePool = rarityPool.length ? rarityPool : availablePool;
    const source = sourcePool[Math.floor(Math.random() * sourcePool.length)] as CardPoolItem;

    const drawnCard: DrawnCard = {
      id: crypto.randomUUID(),
      name: source.name || "未知卡面",
      rarity,
      imageUrl: source.imageUrl,
      obtainedAt: new Date().toISOString(),
    };

    state.cards.unshift(drawnCard);
    isGachaAnimating.value = true;
    openGachaReveal(drawnCard);
  }

  function handleEscape(): boolean {
    if (gachaRevealOpen.value) {
      closeGachaReveal();
      return true;
    }
    if (cardZoomOpen.value) {
      closeCardZoom();
      return true;
    }
    if (cardGalleryOpen.value) {
      closeCardGallery();
      return true;
    }
    return false;
  }

  return {
    isGachaAnimating,
    displayCards,
    previewCards,
    previewStyle,
    setPreviewContainer,
    cardGalleryOpen,
    cardZoomOpen,
    cardZoomImage,
    cardZoomName,
    gachaRevealOpen,
    gachaRevealImage,
    gachaRevealName,
    gachaRevealSpinning,
    drawCard,
    openCardGallery,
    closeCardGallery,
    openCardZoom,
    closeCardZoom,
    closeGachaReveal,
    handleEscape,
  };
}
