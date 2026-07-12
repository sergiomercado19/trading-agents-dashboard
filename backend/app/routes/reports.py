from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.services.run_manager import run_manager
from backend.app.services.debate_extractor import debate_extractor
from backend.app.services.summary_generator import summary_generator

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/debate/{run_id}")
async def get_debate_transcript(run_id: str):
    run = await run_manager.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    # Use reports if available, otherwise empty
    logs = list(run.reports.values()) if run.reports else []
    return debate_extractor.extract(logs)


@router.get("/summary/{run_id}")
async def get_summary(run_id: str):
    run = await run_manager.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"summary": summary_generator.generate(run)}
