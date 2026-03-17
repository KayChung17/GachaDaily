import { ref } from "vue";

import type { SyncPullResponse, SyncPushRequest } from "../types/api";
import type { AppState } from "../types/domain";

export function useRemoteSync(
  state: AppState,
  {
    replaceState,
    normalizeIncoming,
  }: {
    replaceState: (raw: unknown) => void;
    normalizeIncoming: (raw: unknown) => AppState;
  }
) {
  const syncStatus = ref("状态：未同步");

  function getSyncPayload(): AppState {
    const payload = normalizeIncoming(JSON.parse(JSON.stringify(state)));
    payload.settings.syncToken = "";
    return payload;
  }

  async function syncPull(): Promise<void> {
    const url = (state.settings.syncUrl || "").trim();
    if (!url) {
      window.alert("请先填写同步服务地址。");
      return;
    }

    syncStatus.value = "正在拉取...";

    try {
      const token = (state.settings.syncToken || "").trim();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(url, { headers, cache: "no-store" });

      if (!res.ok) {
        syncStatus.value = `拉取失败: ${res.status}`;
        return;
      }

      const data = (await res.json()) as SyncPullResponse;
      if (!data || !data.payload) {
        syncStatus.value = "服务器无有效数据";
        return;
      }

      if (!window.confirm("将覆盖本地数据，是否继续？")) {
        syncStatus.value = "已取消";
        return;
      }

      const currentSyncUrl = state.settings.syncUrl;
      const currentSyncToken = state.settings.syncToken;

      const incoming = normalizeIncoming(data.payload);
      incoming.settings.syncUrl = currentSyncUrl;
      incoming.settings.syncToken = currentSyncToken;

      replaceState(incoming);
      syncStatus.value = "拉取完成";
    } catch (error) {
      syncStatus.value = `拉取失败: ${(error as Error).message}`;
    }
  }

  async function syncPush(): Promise<void> {
    const url = (state.settings.syncUrl || "").trim();
    if (!url) {
      window.alert("请先填写同步服务地址。");
      return;
    }

    syncStatus.value = "正在上传...";

    try {
      const token = (state.settings.syncToken || "").trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const body: SyncPushRequest = {
        updatedAt: new Date().toISOString(),
        payload: getSyncPayload(),
      };

      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        syncStatus.value = `上传失败: ${res.status}`;
        return;
      }

      syncStatus.value = "上传完成";
    } catch (error) {
      syncStatus.value = `上传失败: ${(error as Error).message}`;
    }
  }

  return {
    syncStatus,
    syncPull,
    syncPush,
  };
}
