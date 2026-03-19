from fastapi import APIRouter

from app.api.routes import rss, sync

api_router = APIRouter()
api_router.include_router(rss.router, tags=["rss"])
api_router.include_router(sync.router, tags=["sync"])
