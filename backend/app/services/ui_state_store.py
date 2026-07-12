from __future__ import annotations

import json
from pathlib import Path

from backend.app.core.config import REPO_ROOT

_UI_STATE_PATH = REPO_ROOT / ".ui_state.json"


class UIStateStore:
    """Persistent UI state (active tab, form fields, panel sizes)."""

    def load(self) -> dict:
        if _UI_STATE_PATH.exists():
            try:
                return json.loads(_UI_STATE_PATH.read_text())
            except Exception:
                pass
        return {}

    def save(self, state: dict) -> None:
        _UI_STATE_PATH.write_text(json.dumps(state, indent=2, default=str))


ui_state_store = UIStateStore()
