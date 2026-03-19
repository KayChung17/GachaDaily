from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str
    api_host: str
    api_port: int
    cors_origins: tuple[str, ...]
    sync_data_path: Path
    rss_target_url: str
    rss_timeout_seconds: float


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    root_dir = Path(__file__).resolve().parents[3]
    default_data_path = root_dir / "backend" / "data" / "sync_data.json"

    cors = _split_csv(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5175,http://127.0.0.1:5175",
        )
    )

    return Settings(
        app_name=os.getenv("APP_NAME", "GachaDaily API"),
        api_host=os.getenv("API_HOST", "127.0.0.1"),
        api_port=int(os.getenv("API_PORT", "8056")),
        cors_origins=tuple(cors),
        sync_data_path=Path(os.getenv("SYNC_DATA_PATH", str(default_data_path))),
        rss_target_url=os.getenv(
            "RSS_TARGET_URL",
            "https://rss-hub-mu-murex.vercel.app/pixiv/user/5229572",
        ),
        rss_timeout_seconds=float(os.getenv("RSS_TIMEOUT_SECONDS", "15")),
    )
