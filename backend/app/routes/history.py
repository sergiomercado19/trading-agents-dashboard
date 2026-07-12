from __future__ import annotations

import time
from pathlib import Path

from fastapi import APIRouter

from backend.app.core.config import REPO_ROOT
from backend.app.services.run_manager import run_manager
from backend.app.services.progress_tracker import progress_tracker

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history/stats")
async def get_history_stats():
    runs = await run_manager.list_runs()
    completed = [r for r in runs if r.status == "completed"]
    failed = [r for r in runs if r.status == "error"]
    total_cost = sum(r.stats.cost_usd for r in runs)
    total_tokens = sum(r.stats.tokens_in + r.stats.tokens_out for r in runs)

    # Runs by date
    runs_by_date: dict[str, int] = {}
    cost_by_date: dict[str, float] = {}
    for r in runs:
        if r.started:
            date_str = time.strftime("%Y-%m-%d", time.localtime(r.started))
            runs_by_date[date_str] = runs_by_date.get(date_str, 0) + 1
            cost_by_date[date_str] = cost_by_date.get(date_str, 0) + r.stats.cost_usd

    # Ticker breakdown
    ticker_counts: dict[str, int] = {}
    for r in runs:
        ticker_counts[r.ticker] = ticker_counts.get(r.ticker, 0) + 1

    return {
        "total_runs": len(runs),
        "completed": len(completed),
        "failed": len(failed),
        "running": len([r for r in runs if r.status == "running"]),
        "total_cost_usd": round(total_cost, 4),
        "total_tokens": total_tokens,
        "runs_by_date": runs_by_date,
        "cost_by_date": cost_by_date,
        "ticker_counts": ticker_counts,
    }


@router.get("/history/runs")
async def get_history_runs(limit: int = 50):
    runs = await run_manager.list_runs()
    runs.sort(key=lambda r: r.started or 0, reverse=True)
    return [r.model_dump() for r in runs[:limit]]


@router.get("/history/scheduler")
async def get_scheduler_audit():
    audit = progress_tracker.list_all()
    jobs = []
    for job_id, data in audit.items():
        jobs.append({
            "job_id": job_id,
            "ticker": data.get("ticker", ""),
            "status": data.get("status", "unknown"),
            "last_run": data.get("last_run"),
            "run_id": data.get("run_id"),
            "error": data.get("error"),
        })
    jobs.sort(key=lambda j: j.get("last_run") or 0, reverse=True)
    return jobs


@router.get("/history/memory")
async def get_memory_log():
    meta_path = REPO_ROOT / ".memory_meta.json"
    if meta_path.exists():
        try:
            import json
            return json.loads(meta_path.read_text())
        except Exception:
            pass
    return {"vault_path": None, "last_synced": None, "note_count": 0}
