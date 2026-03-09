from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from app.schemas.sync import SyncRecord


class SyncConflictError(RuntimeError):
    pass


class SyncDataStore:
    def __init__(self, data_path: Path):
        self._data_path = data_path
        self._lock = Lock()

    def _load_unlocked(self) -> SyncRecord | None:
        if not self._data_path.exists():
            return None
        with self._data_path.open("r", encoding="utf-8") as handle:
            raw = json.load(handle)
        return SyncRecord.model_validate(raw)

    def read(self) -> SyncRecord | None:
        with self._lock:
            return self._load_unlocked()

    def write(self, payload: dict, incoming_updated_at: datetime | None) -> SyncRecord:
        with self._lock:
            existing = self._load_unlocked()
            if (
                existing
                and existing.updated_at
                and incoming_updated_at
                and incoming_updated_at < existing.updated_at
            ):
                raise SyncConflictError("older than server copy")

            record = SyncRecord(
                version=(existing.version + 1) if existing else 1,
                updatedAt=datetime.now(timezone.utc),
                payload=payload,
            )
            self._data_path.parent.mkdir(parents=True, exist_ok=True)
            with self._data_path.open("w", encoding="utf-8") as handle:
                json.dump(
                    record.model_dump(by_alias=True, mode="json"),
                    handle,
                    ensure_ascii=False,
                    indent=2,
                )
            return record
