from __future__ import annotations

import asyncio
import json
import time
import uuid
from pathlib import Path

from backend.app.core.config import RUNS_DIR, RUNS_JSON
from backend.app.models.schemas import RunSnapshot, RunStats


class RunManager:
    """Manage concurrent analysis runs with persistence."""

    def __init__(self) -> None:
        self._runs: dict[str, RunSnapshot] = {}
        self._queues: dict[str, asyncio.Queue] = {}
        self._lock = asyncio.Lock()
        RUNS_DIR.mkdir(parents=True, exist_ok=True)
        self._load()

    def _load(self) -> None:
        if RUNS_JSON.exists():
            try:
                data = json.loads(RUNS_JSON.read_text())
                for run_id, run_data in data.items():
                    self._runs[run_id] = RunSnapshot(**run_data)
            except (json.JSONDecodeError, Exception):
                pass

    async def _save(self) -> None:
        data = {rid: r.model_dump() for rid, r in self._runs.items()}
        RUNS_JSON.write_text(json.dumps(data, default=str, indent=2))

    async def create(self, ticker: str, date: str, **kwargs) -> RunSnapshot:
        run_id = uuid.uuid4().hex[:12]
        snapshot = RunSnapshot(
            run_id=run_id,
            ticker=ticker,
            date=date,
            started=time.time(),
            **kwargs,
        )
        async with self._lock:
            self._runs[run_id] = snapshot
            self._queues[run_id] = asyncio.Queue()
            await self._save()
        return snapshot

    async def get(self, run_id: str) -> RunSnapshot | None:
        return self._runs.get(run_id)

    async def get_queue(self, run_id: str) -> asyncio.Queue | None:
        return self._queues.get(run_id)

    async def update(self, run_id: str, **updates) -> RunSnapshot | None:
        async with self._lock:
            run = self._runs.get(run_id)
            if not run:
                return None
            for k, v in updates.items():
                if hasattr(run, k):
                    setattr(run, k, v)
            await self._save()
            return run

    async def add_event(self, run_id: str, event: dict) -> None:
        queue = self._queues.get(run_id)
        if queue:
            await queue.put(event)

    async def list_runs(self) -> list[RunSnapshot]:
        return list(self._runs.values())

    async def get_stats(self) -> dict:
        runs = list(self._runs.values())
        completed = [r for r in runs if r.status == "completed"]
        total_cost = sum(r.stats.cost_usd for r in runs)
        total_tokens = sum(r.stats.tokens_in + r.stats.tokens_out for r in runs)
        return {
            "total_runs": len(runs),
            "completed": len(completed),
            "total_cost_usd": round(total_cost, 4),
            "total_tokens": total_tokens,
        }

    async def stop(self, run_id: str) -> RunSnapshot | None:
        return await self.update(run_id, status="stopped", ended=time.time())

    async def delete(self, run_id: str) -> bool:
        async with self._lock:
            if run_id in self._runs:
                del self._runs[run_id]
                self._queues.pop(run_id, None)
                await self._save()
                return True
            return False


run_manager = RunManager()
