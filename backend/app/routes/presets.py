from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.presets_store import presets_store

router = APIRouter(prefix="/api", tags=["presets"])


class CreatePresetRequest(BaseModel):
    name: str
    config: dict


class UpdatePresetRequest(BaseModel):
    name: str | None = None
    config: dict | None = None


@router.get("/presets")
async def list_presets():
    return [p.model_dump() for p in presets_store.list()]


@router.post("/presets")
async def create_preset(req: CreatePresetRequest):
    return presets_store.create(name=req.name, config=req.config).model_dump()


@router.get("/presets/{preset_id}")
async def get_preset(preset_id: str):
    preset = presets_store.get(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return preset.model_dump()


@router.patch("/presets/{preset_id}")
async def update_preset(preset_id: str, req: UpdatePresetRequest):
    preset = presets_store.update(preset_id, name=req.name, config=req.config)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return preset.model_dump()


@router.delete("/presets/{preset_id}")
async def delete_preset(preset_id: str):
    if not presets_store.delete(preset_id):
        raise HTTPException(status_code=404, detail="Preset not found")
    return {"status": "deleted"}
