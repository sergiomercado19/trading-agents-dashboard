from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.services.run_manager import run_manager

router = APIRouter(prefix="/api", tags=["runs"])


@router.get("/status")
async def get_status():
    runs = await run_manager.list_runs()
    running = [r for r in runs if r.status == "running"]
    return {
        "active_runs": len(running),
        "total_runs": len(runs),
    }


@router.get("/runs")
async def list_runs():
    runs = await run_manager.list_runs()
    return [r.model_dump() for r in runs]


@router.get("/runs/stats")
async def get_run_stats():
    return await run_manager.get_stats()


@router.get("/stats")
async def get_stats_alias():
    return await run_manager.get_stats()


@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    run = await run_manager.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run.model_dump()


@router.post("/stop/{run_id}")
async def stop_run(run_id: str):
    run = await run_manager.stop(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run.model_dump()
