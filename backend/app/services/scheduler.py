from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from pathlib import Path

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from backend.app.core.config import RUNS_DIR
from backend.app.services.progress_tracker import progress_tracker

logger = logging.getLogger(__name__)

SCHEDULER_DB = RUNS_DIR / "scheduler.db"
JOBS_FILE = RUNS_DIR / "scheduler_jobs.json"


def _build_cron_trigger(job_data: dict) -> CronTrigger:
    freq = job_data.get("frequency", "daily")
    hour = job_data.get("hour", 9)
    minute = job_data.get("minute", 0)
    tz = job_data.get("timezone", "UTC")

    if freq == "hourly":
        return CronTrigger(minute=minute, timezone=tz)
    elif freq == "weekly":
        days = job_data.get("days_of_week", ["mon"])
        return CronTrigger(day_of_week=",".join(days), hour=hour, minute=minute, timezone=tz)
    elif freq == "monthly":
        day = job_data.get("day_of_month", 1)
        return CronTrigger(day=day, hour=hour, minute=minute, timezone=tz)
    else:  # daily
        return CronTrigger(hour=hour, minute=minute, timezone=tz)


def _next_run_str(job_data: dict) -> str:
    from datetime import datetime
    trigger = _build_cron_trigger(job_data)
    now = datetime.now(pytz.timezone(job_data.get("timezone", "UTC")))
    next_dt = trigger.get_next_fire_time(None, now)
    if next_dt:
        return next_dt.isoformat()
    return "N/A"


class AnalysisScheduler:
    """APScheduler cron with in-memory + JSON persistence, timezone support."""

    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler()
        self._jobs: dict[str, dict] = {}
        self._loop: asyncio.AbstractEventLoop | None = None
        RUNS_DIR.mkdir(parents=True, exist_ok=True)
        self._load()

    def _load(self) -> None:
        if JOBS_FILE.exists():
            try:
                self._jobs = json.loads(JOBS_FILE.read_text())
            except (json.JSONDecodeError, Exception):
                pass

    def _save(self) -> None:
        JOBS_FILE.write_text(json.dumps(self._jobs, default=str, indent=2))

    def start(self) -> None:
        self._scheduler.start()
        for job_id, job_data in self._jobs.items():
            self._add_to_scheduler(job_id, job_data)
        logger.info("Scheduler started with %d jobs", len(self._jobs))

    def shutdown(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down")

    def _add_to_scheduler(self, job_id: str, job_data: dict) -> None:
        trigger = _build_cron_trigger(job_data)
        try:
            self._scheduler.add_job(
                self._execute_job,
                trigger=trigger,
                args=[job_id],
                id=job_id,
                replace_existing=True,
            )
        except Exception as e:
            logger.error("Failed to add job %s: %s", job_id, e)

    async def _execute_job(self, job_id: str) -> None:
        job_data = self._jobs.get(job_id)
        if not job_data:
            return

        logger.info("Executing scheduled job %s for %s", job_id, job_data.get("ticker"))
        progress_tracker.update(job_id, {
            "status": "running",
            "last_run": time.time(),
            "ticker": job_data.get("ticker"),
        })

        try:
            from backend.app.routes.analyze import _run_analysis_background
            from backend.app.services.run_manager import run_manager

            run = await run_manager.create(
                ticker=job_data["ticker"],
                date=time.strftime("%Y-%m-%d"),
            )
            progress_tracker.update(job_id, {"run_id": run.run_id, "status": "running"})

            from backend.app.models.schemas import AnalyzeRequest
            request = AnalyzeRequest(
                ticker=job_data["ticker"],
                date=time.strftime("%Y-%m-%d"),
                analysts=job_data.get("analysts", ["market", "social", "news", "fundamentals"]),
                research_depth=job_data.get("research_depth", 3),
                provider=job_data.get("provider", "openai"),
                quick_model=job_data.get("quick_model", "gpt-5.4-mini"),
                deep_model=job_data.get("deep_model", "gpt-5.5"),
                output_language=job_data.get("output_language", "English"),
            )

            await _run_analysis_background(run.run_id, request)
            progress_tracker.update(job_id, {
                "status": "completed",
                "last_run": time.time(),
                "run_id": run.run_id,
            })
        except Exception as e:
            logger.exception("Scheduled job %s failed", job_id)
            progress_tracker.update(job_id, {
                "status": "error",
                "error": str(e),
                "last_run": time.time(),
            })

    def add_job(self, job_data: dict) -> dict:
        job_id = uuid.uuid4().hex[:12]
        job_data["created_at"] = time.time()
        self._jobs[job_id] = job_data
        self._add_to_scheduler(job_id, job_data)
        self._save()
        result = {"job_id": job_id, **job_data}
        result["next_run"] = _next_run_str(job_data)
        return result

    def remove_job(self, job_id: str) -> bool:
        if job_id not in self._jobs:
            return False
        try:
            self._scheduler.remove_job(job_id)
        except Exception:
            pass
        del self._jobs[job_id]
        self._save()
        progress_tracker.clear(job_id)
        return True

    def list_jobs(self) -> list[dict]:
        results = []
        for job_id, job_data in self._jobs.items():
            entry = {"job_id": job_id, **job_data}
            entry["next_run"] = _next_run_str(job_data)
            progress = progress_tracker.read(job_id)
            if progress:
                entry["progress"] = progress
            results.append(entry)
        return results

    def get_job(self, job_id: str) -> dict | None:
        job_data = self._jobs.get(job_id)
        if not job_data:
            return None
        entry = {"job_id": job_id, **job_data}
        entry["next_run"] = _next_run_str(job_data)
        progress = progress_tracker.read(job_id)
        if progress:
            entry["progress"] = progress
        return entry


scheduler = AnalysisScheduler()
