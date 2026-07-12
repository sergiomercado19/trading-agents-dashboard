from __future__ import annotations

import json
from pathlib import Path

from backend.app.core.config import RUNS_DIR

PROGRESS_DIR = RUNS_DIR / "scheduler_progress"


class ProgressTracker:
    """JSON status file writer/reader for background scheduler jobs."""

    def __init__(self) -> None:
        PROGRESS_DIR.mkdir(parents=True, exist_ok=True)

    def _path(self, job_id: str) -> Path:
        return PROGRESS_DIR / f"{job_id}.json"

    def update(self, job_id: str, data: dict) -> None:
        path = self._path(job_id)
        existing = self.read(job_id)
        existing.update(data)
        path.write_text(json.dumps(existing, default=str, indent=2))

    def read(self, job_id: str) -> dict:
        path = self._path(job_id)
        if path.exists():
            try:
                return json.loads(path.read_text())
            except (json.JSONDecodeError, Exception):
                pass
        return {}

    def clear(self, job_id: str) -> None:
        path = self._path(job_id)
        if path.exists():
            path.unlink()

    def list_all(self) -> dict[str, dict]:
        results = {}
        for f in PROGRESS_DIR.glob("*.json"):
            job_id = f.stem
            results[job_id] = self.read(job_id)
        return results


progress_tracker = ProgressTracker()
