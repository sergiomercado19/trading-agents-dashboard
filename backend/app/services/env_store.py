from __future__ import annotations

import os
import threading
from pathlib import Path

from dotenv import dotenv_values

from backend.app.core.config import ENV_PATH

_SENSITIVE_KEYS = {"_API_KEY", "_SECRET", "_TOKEN", "_PASSWORD", "_BEARER"}

_lock = threading.Lock()


def _mask_value(key: str, value: str) -> str:
    if not value:
        return ""
    for suffix in _SENSITIVE_KEYS:
        if key.upper().endswith(suffix.upper()):
            if len(value) <= 8:
                return "*" * len(value)
            return value[:4] + "*" * (len(value) - 8) + value[-4:]
    return value


class EnvStore:
    """Atomic .env read/write with value masking."""

    def __init__(self, path: Path | None = None) -> None:
        self._path = path or ENV_PATH

    @property
    def path(self) -> Path:
        return self._path

    def exists(self) -> bool:
        return self._path.is_file()

    def read(self) -> dict[str, str]:
        if not self.exists():
            return {}
        return dotenv_values(self._path)

    def read_masked(self) -> dict[str, str]:
        raw = self.read()
        return {k: _mask_value(k, v or "") for k, v in raw.items()}

    def write(self, data: dict[str, str]) -> None:
        lines = []
        for key, value in data.items():
            if value is None:
                continue
            lines.append(f"{key}={value}")
        content = "\n".join(lines) + "\n" if lines else ""

        with _lock:
            self._path.write_text(content)

    def update(self, updates: dict[str, str | None]) -> dict[str, str]:
        current = self.read()
        current.update(updates)
        self.write(current)
        return current

    def get(self, key: str, default: str | None = None) -> str | None:
        return self.read().get(key, default)

    def set(self, key: str, value: str) -> None:
        current = self.read()
        current[key] = value
        self.write(current)


env_store = EnvStore()
