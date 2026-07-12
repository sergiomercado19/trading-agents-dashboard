from __future__ import annotations

import json
import os
import time
from datetime import datetime
from pathlib import Path

from backend.app.core.config import REPO_ROOT
from backend.app.models.schemas import MemoryStatus

# Default vault path for Obsidian integration
_DEFAULT_VAULT = str(Path.home() / "tradingagents-vault")
_CHROMA_DIR = str(REPO_ROOT / ".chroma")
_COLLECTION = "trading_memory"


class MemoryService:
    """ChromaDB vector store for TradingAgents memory/RAG."""

    def __init__(self) -> None:
        self._client = None
        self._collection = None
        self._vault_path: str | None = None
        self._is_docker: bool = False
        self._last_synced: str | None = None
        self._note_count: int = 0
        self._meta_path = REPO_ROOT / ".memory_meta.json"
        self._load_meta()
        self._detect_docker()

    def _detect_docker(self) -> None:
        if os.path.exists("/.dockerenv"):
            self._is_docker = True
        elif Path("/proc/1/cgroup").exists():
            try:
                cgroup = Path("/proc/1/cgroup").read_text()
                if "docker" in cgroup or "kubepods" in cgroup:
                    self._is_docker = True
            except Exception:
                pass

    def _load_meta(self) -> None:
        if self._meta_path.exists():
            try:
                data = json.loads(self._meta_path.read_text())
                self._vault_path = data.get("vault_path")
                self._last_synced = data.get("last_synced")
                self._note_count = data.get("note_count", 0)
            except Exception:
                pass

    def _save_meta(self) -> None:
        data = {
            "vault_path": self._vault_path,
            "last_synced": self._last_synced,
            "note_count": self._note_count,
        }
        self._meta_path.write_text(json.dumps(data, indent=2))

    def _get_collection(self):
        if self._collection is not None:
            return self._collection
        try:
            import chromadb
            client = chromadb.PersistentClient(path=_CHROMA_DIR)
            self._collection = client.get_or_create_collection(
                _COLLECTION,
                metadata={"hnsw:space": "cosine"},
            )
            return self._collection
        except Exception:
            return None

    def get_status(self) -> MemoryStatus:
        col = self._get_collection()
        count = self._collection.count() if self._collection else 0
        return MemoryStatus(
            collection=_COLLECTION,
            note_count=count,
            last_synced=self._last_synced,
            vault_path=self._vault_path,
            is_docker=self._is_docker,
        )

    def set_vault_path(self, path: str) -> None:
        self._vault_path = path
        self._save_meta()

    def sync_vault(self) -> dict:
        vault = Path(self._vault_path or _DEFAULT_VAULT)
        if not vault.exists():
            return {"status": "error", "message": f"Vault not found: {vault}"}

        col = self._get_collection()
        if col is None:
            return {"status": "error", "message": "ChromaDB not available"}

        md_files = list(vault.rglob("*.md"))
        if not md_files:
            return {"status": "ok", "indexed": 0, "message": "No .md files found in vault"}

        indexed = 0
        ids, documents, metadatas = [], [], []

        for f in md_files:
            try:
                content = f.read_text(encoding="utf-8", errors="replace")
                if not content.strip():
                    continue
                # Chunk large files
                chunks = self._chunk_text(content, max_len=2000)
                for i, chunk in enumerate(chunks):
                    doc_id = f"{f.stem}_{i}"
                    ids.append(doc_id)
                    documents.append(chunk)
                    metadatas.append({
                        "source": str(f.relative_to(vault)),
                        "filename": f.name,
                        "chunk": i,
                        "synced_at": time.time(),
                    })
                    indexed += 1
            except Exception:
                continue

        if ids:
            # Upsert in batches
            batch_size = 100
            for start in range(0, len(ids), batch_size):
                end = min(start + batch_size, len(ids))
                col.upsert(
                    ids=ids[start:end],
                    documents=documents[start:end],
                    metadatas=metadatas[start:end],
                )

        self._note_count = col.count()
        self._last_synced = datetime.now().isoformat()
        self._save_meta()

        return {"status": "ok", "indexed": indexed, "total_files": len(md_files)}

    def search(self, query: str, n_results: int = 10) -> list[dict]:
        col = self._get_collection()
        if col is None or col.count() == 0:
            return []
        try:
            results = col.query(
                query_texts=[query],
                n_results=min(n_results, col.count()),
            )
            out = []
            for i in range(len(results["ids"][0])):
                out.append({
                    "id": results["ids"][0][i],
                    "document": results["documents"][0][i],
                    "distance": results["distances"][0][i] if results.get("distances") else None,
                    "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                })
            return out
        except Exception:
            return []

    def get_observations(self) -> list[dict]:
        col = self._get_collection()
        if col is None or col.count() == 0:
            return []
        try:
            results = col.get(limit=100, include=["documents", "metadatas"])
            out = []
            for i in range(len(results["ids"])):
                out.append({
                    "id": results["ids"][i],
                    "document": results["documents"][i],
                    "metadata": results["metadatas"][i],
                })
            return out
        except Exception:
            return []

    def save_to_obsidian(self, ticker: str, report_content: str, vault_path: str | None = None) -> dict:
        vault = Path(vault_path or self._vault_path or _DEFAULT_VAULT)
        reports_dir = vault / "TradingAgents" / "Reports"
        reports_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        filepath = reports_dir / filename
        filepath.write_text(report_content, encoding="utf-8")

        return {"status": "ok", "path": str(filepath)}

    def _chunk_text(self, text: str, max_len: int = 2000) -> list[str]:
        if len(text) <= max_len:
            return [text]
        chunks = []
        paragraphs = text.split("\n\n")
        current = ""
        for p in paragraphs:
            if len(current) + len(p) > max_len and current:
                chunks.append(current.strip())
                current = p
            else:
                current += "\n\n" + p if current else p
        if current.strip():
            chunks.append(current.strip())
        return chunks or [text[:max_len]]


memory_service = MemoryService()
