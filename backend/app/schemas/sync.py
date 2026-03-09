from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SyncRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    version: int = 0
    updated_at: datetime | None = Field(default=None, alias="updatedAt")
    payload: dict[str, Any] | None = None


class SyncPushRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    updated_at: datetime | None = Field(default=None, alias="updatedAt")
    payload: dict[str, Any]
