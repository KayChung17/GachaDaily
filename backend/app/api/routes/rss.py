from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query, Response

from app.core.config import get_settings

router = APIRouter()


@router.get("/rss")
async def proxy_rss(url: str | None = Query(default=None, description="自定义 RSS URL")):
    settings = get_settings()
    target_url = (url or settings.rss_target_url).strip()

    if not target_url or target_url.startswith("<"):
        raise HTTPException(
            status_code=400,
            detail="请先设置 RSS_TARGET_URL，或通过 ?url= 指定可访问的 RSS 地址。",
        )

    try:
        async with httpx.AsyncClient(timeout=settings.rss_timeout_seconds) as client:
            upstream = await client.get(
                target_url,
                headers={"User-Agent": "gacha-daily-rss-proxy/2.0"},
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}") from exc

    headers = {
        "Cache-Control": "no-store",
        "Content-Type": upstream.headers.get(
            "Content-Type", "application/xml; charset=utf-8"
        ),
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=headers,
    )
