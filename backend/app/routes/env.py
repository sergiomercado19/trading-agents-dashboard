from __future__ import annotations

from fastapi import APIRouter

from backend.app.services.env_store import env_store

router = APIRouter(prefix="/api", tags=["env"])


@router.get("/env")
async def get_env():
    return env_store.read_masked()


@router.post("/env")
async def save_env(data: dict[str, str | None]):
    env_store.update(data)
    return {"status": "ok", "env": env_store.read_masked()}
