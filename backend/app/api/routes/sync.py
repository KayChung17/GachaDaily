from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, HTTPException

from app.schemas.sync import SyncPushRequest, SyncRecord
from app.services.sync_store import SyncConflictError, SyncDataStore
from app.core.config import get_settings

router = APIRouter()


@lru_cache(maxsize=1)
def get_sync_store() -> SyncDataStore:
    settings = get_settings()
    return SyncDataStore(settings.sync_data_path)


@router.get("/sync", response_model=SyncRecord)
def sync_pull():
    record = get_sync_store().read()
    if record is None:
        return SyncRecord(version=0, updatedAt=None, payload=None)
    return record


@router.put("/sync", response_model=SyncRecord)
def sync_push(body: SyncPushRequest):
    try:
        return get_sync_store().write(body.payload, body.updated_at)
    except SyncConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
