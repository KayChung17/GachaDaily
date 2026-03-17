import { reactive, watch } from "vue";

import type { AppState } from "../types/domain";

const STORAGE_KEY = "starlit-todo-state";

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDefaults(apiBase: string): AppState {
  const cleanBase = (apiBase || "").replace(/\/$/, "");
  const defaultRssUrl = cleanBase ? `${cleanBase}/api/rss` : "/api/rss";
  const defaultSyncUrl = cleanBase ? `${cleanBase}/api/sync` : "/api/sync";

  return {
    currency: 0,
    tasks: [],
    cards: [],
    settings: {
      gachaCost: 100,
      rssUrl: defaultRssUrl,
      activePage: "tasks",
      themeMode: "gorgeous",
      syncUrl: defaultSyncUrl,
      syncToken: "",
      cardPool: [],
    },
  };
}

function normalizeState(raw: unknown, defaults: AppState): AppState {
  const base = cloneValue(defaults);
  const input = (raw || {}) as Partial<AppState>;

  const merged: AppState = {
    ...base,
    ...input,
    settings: {
      ...base.settings,
      ...(input.settings || {}),
    },
  };

  merged.tasks = Array.isArray(merged.tasks) ? merged.tasks : [];
  merged.cards = Array.isArray(merged.cards) ? merged.cards : [];
  merged.settings.cardPool = Array.isArray(merged.settings.cardPool)
    ? merged.settings.cardPool
    : [];

  return merged;
}

function loadState(defaults: AppState): AppState {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneValue(defaults);

  try {
    return normalizeState(JSON.parse(saved), defaults);
  } catch (error) {
    console.warn("本地数据解析失败，已重置。", error);
    return cloneValue(defaults);
  }
}

function assignState(target: AppState, next: AppState): void {
  target.currency = Number(next.currency || 0);
  target.tasks = Array.isArray(next.tasks) ? next.tasks : [];
  target.cards = Array.isArray(next.cards) ? next.cards : [];
  target.settings = {
    ...next.settings,
    cardPool: Array.isArray(next.settings?.cardPool) ? next.settings.cardPool : [],
  };
}

export function useAppState({ apiBase }: { apiBase: string }) {
  const defaults = createDefaults(apiBase);
  const state = reactive(loadState(defaults)) as AppState;

  watch(
    state,
    () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    { deep: true }
  );

  function normalizeIncoming(raw: unknown): AppState {
    return normalizeState(raw, defaults);
  }

  function replaceState(raw: unknown): void {
    assignState(state, normalizeIncoming(raw));
  }

  return {
    state,
    replaceState,
    normalizeIncoming,
  };
}
