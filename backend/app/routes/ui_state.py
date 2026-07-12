from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.services.ui_state_store import ui_state_store

router = APIRouter(prefix="/api", tags=["ui_state"])


class UIStateRequest(BaseModel):
    state: dict


@router.get("/ui_state")
async def load_ui_state():
    return ui_state_store.load()


@router.post("/ui_state")
async def save_ui_state(req: UIStateRequest):
    ui_state_store.save(req.state)
    return {"status": "saved"}
