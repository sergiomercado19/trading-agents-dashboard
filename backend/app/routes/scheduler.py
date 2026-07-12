from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.scheduler import scheduler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


class CreateJobRequest(BaseModel):
    ticker: str
    frequency: str = "daily"
    hour: int = 9
    minute: int = 0
    timezone: str = "UTC"
    day_of_week: list[str] | None = None
    day_of_month: int | None = None
    analysts: list[str] = ["market", "social", "news", "fundamentals"]
    research_depth: int = 3
    provider: str = "openai"
    quick_model: str = "gpt-5.4-mini"
    deep_model: str = "gpt-5.5"
    output_language: str = "English"


@router.get("/jobs")
async def list_jobs():
    return scheduler.list_jobs()


@router.post("/jobs")
async def create_job(request: CreateJobRequest):
    job_data = request.model_dump()
    if request.day_of_week:
        job_data["days_of_week"] = request.day_of_week
    result = scheduler.add_job(job_data)
    return result


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    if not scheduler.remove_job(job_id):
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "deleted", "job_id": job_id}


@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    job = scheduler.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
