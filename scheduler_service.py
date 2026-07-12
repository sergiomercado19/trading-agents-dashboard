#!/usr/bin/env python3
"""APScheduler daemon for TradingAgents scheduled analyses.

Usage:
    python scheduler_service.py          # foreground
    python scheduler_service.py stop     # stop background daemon
"""
from __future__ import annotations

import asyncio
import logging
import signal
import sys
from pathlib import Path

from backend.app.core.config import RUNS_DIR

PID_FILE = RUNS_DIR / "scheduler.pid"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("scheduler_daemon")


def _write_pid() -> None:
    PID_FILE.write_text(str(__import__("os").getpid()))


def _remove_pid() -> None:
    if PID_FILE.exists():
        PID_FILE.unlink()


def _read_pid() -> int | None:
    if PID_FILE.exists():
        try:
            return int(PID_FILE.read_text().strip())
        except (ValueError, Exception):
            pass
    return None


def stop_daemon() -> None:
    pid = _read_pid()
    if pid is None:
        print("Scheduler daemon is not running.")
        return
    try:
        import os
        os.kill(pid, signal.SIGTERM)
        print(f"Sent SIGTERM to scheduler daemon (PID {pid})")
    except ProcessLookupError:
        print(f"PID {pid} not found. Cleaning up stale PID file.")
        _remove_pid()
    except Exception as e:
        print(f"Error stopping daemon: {e}")


async def run_foreground() -> None:
    from backend.app.services.scheduler import scheduler

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, lambda: asyncio.ensure_future(_shutdown(scheduler)))

    _write_pid()
    scheduler.start()
    logger.info("Scheduler daemon running in foreground (PID %d)", __import__("os").getpid())

    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        scheduler.shutdown()
        _remove_pid()


async def _shutdown(scheduler) -> None:
    logger.info("Shutting down scheduler daemon...")
    scheduler.shutdown()
    _remove_pid()
    __import__("asyncio").get_event_loop().stop()


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "stop":
        stop_daemon()
        return

    if _read_pid() is not None:
        print("Scheduler daemon is already running. Use 'python scheduler_service.py stop' to stop it.")
        return

    asyncio.run(run_foreground())


if __name__ == "__main__":
    main()
