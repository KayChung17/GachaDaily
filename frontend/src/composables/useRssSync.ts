import type { AppState } from "../types/domain";
import type { ParsedRssCard } from "../types/api";

function parseRssItems(xmlText: string): ParsedRssCard[] {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const items = Array.from(xml.querySelectorAll("item"));

  return items.flatMap((item) => {
    const title = item.querySelector("title")?.textContent?.trim() || "未命名";
    const link = item.querySelector("link")?.textContent?.trim() || "";
    const author = item.querySelector("author")?.textContent?.trim() || "";
    const desc = item.querySelector("description")?.textContent || "";
    const html = new DOMParser().parseFromString(desc, "text/html");
    const images = Array.from(html.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter(Boolean) as string[];

    return images.map((src, index) => ({
      name: images.length > 1 ? `${title} #${index + 1}` : title,
      imageUrl: src,
      rarity: "SR",
      sourceLink: link,
      author,
    }));
  });
}

export function useRssSync(state: AppState, { apiBase }: { apiBase: string }) {
  function resolveRssFetchUrl(rawUrl: string): string {
    const value = (rawUrl || "").trim();
    if (!value) return "";

    let parsed: URL;
    try {
      parsed = new URL(value, window.location.origin);
    } catch (_) {
      return value;
    }

    if (parsed.pathname.endsWith("/api/rss")) {
      return parsed.toString();
    }

    if (parsed.origin !== window.location.origin) {
      const proxyBase = apiBase ? `${apiBase}/api/rss` : "/api/rss";
      const proxyUrl = new URL(proxyBase, window.location.origin);
      proxyUrl.searchParams.set("url", parsed.toString());
      return proxyUrl.toString();
    }

    return parsed.toString();
  }

  async function syncRssToPool(): Promise<void> {
    const url = (state.settings.rssUrl || "").trim();
    if (!url) {
      window.alert("请先填写 RSS 订阅链接。");
      return;
    }

    try {
      const requestUrl = resolveRssFetchUrl(url);
      const res = await fetch(requestUrl, { cache: "no-store" });
      if (!res.ok) {
        window.alert(`RSS 请求失败: ${res.status}`);
        return;
      }

      const cards = parseRssItems(await res.text());
      if (!cards.length) {
        window.alert("没有解析到可用图片。");
        return;
      }

      const existing = new Set(state.settings.cardPool.map((card) => card.imageUrl));
      const newCards = cards.filter((card) => !existing.has(card.imageUrl));

      if (!newCards.length) {
        window.alert("画师还在摸鱼，去干点别的吧。");
        return;
      }

      newCards.forEach((card) => {
        state.settings.cardPool.unshift({
          id: crypto.randomUUID(),
          name: card.name,
          imageUrl: card.imageUrl,
          rarity: card.rarity,
          sourceLink: card.sourceLink,
          author: card.author,
        });
      });

      window.alert(`已加入 ${newCards.length} 张新卡面。`);
    } catch (error) {
      if (error instanceof TypeError) {
        window.alert(
          "RSS 同步失败：后端服务不可达，请确认 FastAPI 已启动在 http://127.0.0.1:8056"
        );
        return;
      }
      window.alert(`RSS 同步失败: ${(error as Error).message}`);
    }
  }

  return {
    syncRssToPool,
  };
}
