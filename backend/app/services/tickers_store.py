from __future__ import annotations

import json
from pathlib import Path

from backend.app.core.config import REPO_ROOT

_TICKERS_PATH = REPO_ROOT / "tickers.json"


class TickersStore:
    """JSON-on-disk ticker→company name mappings."""

    def _load(self) -> dict[str, str]:
        if not _TICKERS_PATH.exists():
            return {}
        try:
            return json.loads(_TICKERS_PATH.read_text())
        except Exception:
            return {}

    def _save(self, data: dict[str, str]) -> None:
        _TICKERS_PATH.write_text(json.dumps(data, indent=2, sort_keys=True))

    def list(self) -> dict[str, str]:
        return self._load()

    def update(self, mappings: dict[str, str | None]) -> dict[str, str]:
        """Merge updates into existing mappings. Set value to None to delete."""
        data = self._load()
        for ticker, name in mappings.items():
            if name is None:
                data.pop(ticker.upper(), None)
            else:
                data[ticker.upper()] = name
        self._save(data)
        return data


tickers_store = TickersStore()
