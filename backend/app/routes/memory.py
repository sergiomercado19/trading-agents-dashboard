from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.memory_service import memory_service

router = APIRouter(prefix="/api/memory", tags=["memory"])


class VaultPathRequest(BaseModel):
    path: str


class SaveToObsidianRequest(BaseModel):
    ticker: str
    report_content: str
    vault_path: str | None = None


class SearchRequest(BaseModel):
    query: str
    n_results: int = 10


@router.get("/status")
async def get_memory_status():
    return memory_service.get_status().model_dump()


@router.post("/vault")
async def set_vault_path(req: VaultPathRequest):
    memory_service.set_vault_path(req.path)
    return {"status": "ok", "vault_path": req.path}


@router.post("/sync")
async def sync_vault():
    return memory_service.sync_vault()


@router.post("/obsidian/save")
async def save_to_obsidian(req: SaveToObsidianRequest):
    return memory_service.save_to_obsidian(
        ticker=req.ticker,
        report_content=req.report_content,
        vault_path=req.vault_path,
    )


@router.get("/observations")
async def get_observations():
    return memory_service.get_observations()


@router.post("/search")
async def search_memories(req: SearchRequest):
    return memory_service.search(query=req.query, n_results=req.n_results)
