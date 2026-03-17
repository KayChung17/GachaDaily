import type { AppState } from "./domain";

export interface SyncPushRequest {
  updatedAt: string;
  payload: AppState;
}

export interface SyncPullResponse {
  version: number;
  updatedAt: string | null;
  payload: AppState | null;
}

export interface ParsedRssCard {
  name: string;
  imageUrl: string;
  rarity: string;
  sourceLink: string;
  author: string;
}
