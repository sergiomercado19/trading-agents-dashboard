from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.schemas import AnalyzeRequest

logger = logging.getLogger(__name__)


class AnalysisQueue:
    """Enforce max_concurrent=1 for analysis runs via an in-memory queue."""

    def __init__(self, max_concurrent: int = 1) -> None:
        self._max_concurrent = max_concurrent
        self._pending: list[str] = []
        self._active_count: int = 0
        self._requests: dict[str, AnalyzeRequest] = {}

    def enqueue(self, run_id: str, request: AnalyzeRequest) -> None:
        self._requests[run_id] = request
        self._pending.append(run_id)
        if self._active_count < self._max_concurrent:
            self._start_next()

    def _start_next(self) -> None:
        if self._active_count >= self._max_concurrent or not self._pending:
            return

        run_id = self._pending.pop(0)
        request = self._requests.pop(run_id)
        self._active_count += 1

        logger.info("Starting queued run %s (active: %d)", run_id, self._active_count)

        from app.routes.analyze import _run_analysis_background, _active_runs
        from app.services.run_manager import run_manager

        async def _wrapper() -> None:
            try:
                await run_manager.update(run_id, status="running")
                await _run_analysis_background(run_id, request)
            finally:
                self.on_run_finished(run_id)

        task = asyncio.create_task(_wrapper())
        _active_runs[run_id] = task

    def on_run_finished(self, run_id: str) -> None:
        self._active_count = max(0, self._active_count - 1)
        logger.info("Run %s finished (active: %d, pending: %d)", run_id, self._active_count, len(self._pending))
        self._start_next()

    def remove(self, run_id: str) -> bool:
        try:
            self._pending.remove(run_id)
            self._requests.pop(run_id, None)
            return True
        except ValueError:
            return False

    @property
    def pending_ids(self) -> list[str]:
        return list(self._pending)


analysis_queue = AnalysisQueue()
