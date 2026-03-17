export type RepeatMode = "none" | "daily" | "weekly" | "monthly";
export type ThemeMode = "gorgeous" | "minimal";

export interface Task {
  id: string;
  title: string;
  deadline: string;
  repeat: RepeatMode;
  importance: number;
  difficulty: number;
  createdAt: string;
  completedAt: string;
  reward: number;
}

export interface DrawnCard {
  id: string;
  name: string;
  rarity: string;
  imageUrl: string;
  obtainedAt: string;
}

export interface CardPoolItem {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
  sourceLink?: string;
  author?: string;
}

export interface AppSettings {
  gachaCost: number;
  rssUrl: string;
  activePage: "tasks" | "cards" | "settings";
  themeMode: ThemeMode;
  syncUrl: string;
  syncToken: string;
  cardPool: CardPoolItem[];
}

export interface AppState {
  currency: number;
  tasks: Task[];
  cards: DrawnCard[];
  settings: AppSettings;
}

export interface SyncEnvelope {
  version: number;
  updatedAt: string | null;
  payload: AppState | null;
}
