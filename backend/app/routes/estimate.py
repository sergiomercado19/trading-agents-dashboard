from __future__ import annotations

from fastapi import APIRouter

from backend.app.models.schemas import AnalyzeRequest
from backend.app.services.cost_estimator import cost_estimator

router = APIRouter(prefix="/api", tags=["estimate"])


@router.post("/estimate")
async def estimate_cost(request: AnalyzeRequest):
    return cost_estimator.estimate_cost(request)


@router.get("/pricing")
async def get_pricing(provider: str | None = None):
    return cost_estimator.get_pricing(provider)
