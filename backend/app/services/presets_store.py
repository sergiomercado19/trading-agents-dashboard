from __future__ import annotations

import json
import time
import uuid
from pathlib import Path

from backend.app.core.config import REPO_ROOT
from backend.app.models.schemas import Preset

_PRESETS_DIR = REPO_ROOT / ".presets"


class PresetsStore:
    """JSON-on-disk preset CRUD for analysis configurations."""

    def __init__(self) -> None:
        _PRESETS_DIR.mkdir(parents=True, exist_ok=True)

    def _path(self, preset_id: str) -> Path:
        return _PRESETS_DIR / f"{preset_id}.json"

    def list(self) -> list[Preset]:
        presets = []
        for f in sorted(_PRESETS_DIR.glob("*.json")):
            try:
                data = json.loads(f.read_text())
                presets.append(Preset(**data))
            except Exception:
                continue
        return presets

    def get(self, preset_id: str) -> Preset | None:
        path = self._path(preset_id)
        if not path.exists():
            return None
        try:
            return Preset(**json.loads(path.read_text()))
        except Exception:
            return None

    def create(self, name: str, config: dict) -> Preset:
        now = time.time()
        preset = Preset(
            id=str(uuid.uuid4())[:8],
            name=name,
            config=config,
            created_at=now,
            updated_at=now,
        )
        self._save(preset)
        return preset

    def update(self, preset_id: str, name: str | None = None, config: dict | None = None) -> Preset | None:
        preset = self.get(preset_id)
        if not preset:
            return None
        if name is not None:
            preset.name = name
        if config is not None:
            preset.config = config
        preset.updated_at = time.time()
        self._save(preset)
        return preset

    def delete(self, preset_id: str) -> bool:
        path = self._path(preset_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def _save(self, preset: Preset) -> None:
        self._path(preset.id).write_text(json.dumps(preset.model_dump(), indent=2, default=str))


presets_store = PresetsStore()
