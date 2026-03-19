import { computed, inject, provide, watch, type InjectionKey } from "vue";

import { useAppState } from "../composables/useAppState";
import { useGacha } from "../composables/useGacha";
import { useRemoteSync } from "../composables/useRemoteSync";
import { useRssSync } from "../composables/useRssSync";
import { useTasks } from "../composables/useTasks";

function createAppStore(apiBase: string) {
  const { state, replaceState, normalizeIncoming } = useAppState({ apiBase });
  const taskModule = useTasks(state);
  const gachaModule = useGacha(state);
  const rssModule = useRssSync(state, { apiBase });
  const syncModule = useRemoteSync(state, { replaceState, normalizeIncoming });

  const activePage = computed(() => state.settings.activePage || "tasks");
  const themeMode = computed(() =>
    state.settings.themeMode === "minimal" ? "minimal" : "gorgeous"
  );

  function setActivePage(page: "tasks" | "cards" | "settings"): void {
    state.settings.activePage = page || "tasks";
    if (state.settings.activePage !== "cards") {
      gachaModule.closeCardGallery();
      gachaModule.closeGachaReveal();
    }
  }

  function handleGlobalEscape(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    gachaModule.handleEscape();
  }

  watch(
    themeMode,
    (value) => {
      document.body.dataset.theme = value;
    },
    { immediate: true }
  );

  return {
    apiBase,
    state,
    taskModule,
    gachaModule,
    rssModule,
    syncModule,
    activePage,
    themeMode,
    setActivePage,
    handleGlobalEscape,
  };
}

export type AppStore = ReturnType<typeof createAppStore>;

const APP_STORE_KEY: InjectionKey<AppStore> = Symbol("app-store");

export function provideAppStore(apiBase: string): AppStore {
  const store = createAppStore(apiBase);
  provide(APP_STORE_KEY, store);
  return store;
}

export function useAppStore(): AppStore {
  const store = inject(APP_STORE_KEY);
  if (!store) {
    throw new Error("App store is not provided.");
  }
  return store;
}
