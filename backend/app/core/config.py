from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = REPO_ROOT / ".env"
RUNS_DIR = Path(os.environ.get("TRADINGAGENTS_RUNS_DIR", Path.home() / ".tradingagents"))
RUNS_JSON = RUNS_DIR / "runs.json"
