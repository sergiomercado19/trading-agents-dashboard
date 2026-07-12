#!/usr/bin/env python3
"""Start/stop the TradingAgents scheduler daemon.

Usage:
    python run_scheduler.py          # start in background
    python run_scheduler.py stop     # stop background daemon
    python run_scheduler.py status   # check if running
"""
from __future__ import annotations

import os
import signal
import sys
from pathlib import Path

RUNS_DIR = Path(os.environ.get("TRADINGAGENTS_RUNS_DIR", Path.home() / ".tradingagents"))
PID_FILE = RUNS_DIR / "scheduler.pid"


def _read_pid() -> int | None:
    if PID_FILE.exists():
        try:
            return int(PID_FILE.read_text().strip())
        except (ValueError, Exception):
            pass
    return None


def status() -> None:
    pid = _read_pid()
    if pid is None:
        print("Scheduler daemon is NOT running.")
        return
    try:
        os.kill(pid, 0)
        print(f"Scheduler daemon is running (PID {pid}).")
    except ProcessLookupError:
        print(f"Scheduler daemon PID {pid} not found. Stale PID file.")
        PID_FILE.unlink(missing_ok=True)


def stop() -> None:
    pid = _read_pid()
    if pid is None:
        print("Scheduler daemon is not running.")
        return
    try:
        os.kill(pid, signal.SIGTERM)
        print(f"Sent SIGTERM to scheduler daemon (PID {pid})")
    except ProcessLookupError:
        print(f"PID {pid} not found. Cleaning up.")
        PID_FILE.unlink(missing_ok=True)
    except Exception as e:
        print(f"Error: {e}")


def start() -> None:
    if _read_pid() is not None:
        print("Scheduler daemon is already running.")
        return

    pid = os.fork()
    if pid > 0:
        print(f"Scheduler daemon started in background (PID {pid})")
        return

    # Child process
    os.setsid()
    sys.stdin.close()

    # Redirect stdio to log file
    log_file = RUNS_DIR / "scheduler.log"
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    fd = os.open(str(log_file), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    os.close(fd)

    # Run the scheduler
    from scheduler_service import run_foreground
    asyncio_module = __import__("asyncio")
    asyncio_module.run(run_foreground())


def main() -> None:
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "stop":
            stop()
        elif cmd == "status":
            status()
        else:
            print(f"Unknown command: {cmd}")
            print("Usage: python run_scheduler.py [stop|status]")
    else:
        start()


if __name__ == "__main__":
    main()
