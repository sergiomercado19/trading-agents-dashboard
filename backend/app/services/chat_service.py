from __future__ import annotations

import json
import time
import uuid
from pathlib import Path

from backend.app.core.config import REPO_ROOT
from backend.app.models.schemas import (
    ChatMessage,
    ChatSession,
    ChatSessionSummary,
)

_SESSIONS_DIR = REPO_ROOT / ".chat_sessions"


class ChatService:
    """Multi-session chat with report pinning and JSON persistence."""

    def __init__(self) -> None:
        _SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

    def _session_path(self, session_id: str) -> Path:
        return _SESSIONS_DIR / f"{session_id}.json"

    def list_sessions(self) -> list[ChatSessionSummary]:
        sessions = []
        for f in sorted(_SESSIONS_DIR.glob("*.json"), reverse=True):
            try:
                data = json.loads(f.read_text())
                sessions.append(ChatSessionSummary(
                    id=data["id"],
                    title=data.get("title", "New Chat"),
                    model=data.get("model", "gpt-4o-mini"),
                    pinned_reports=data.get("pinned_reports", []),
                    created_at=data.get("created_at", 0),
                    updated_at=data.get("updated_at", 0),
                    message_count=len(data.get("messages", [])),
                ))
            except Exception:
                continue
        return sessions

    def create_session(self, title: str = "New Chat", model: str = "gpt-4o-mini") -> ChatSession:
        now = time.time()
        session = ChatSession(
            id=str(uuid.uuid4())[:8],
            title=title,
            model=model,
            pinned_reports=[],
            messages=[],
            created_at=now,
            updated_at=now,
        )
        self._save(session)
        return session

    def get_session(self, session_id: str) -> ChatSession | None:
        path = self._session_path(session_id)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            return ChatSession(**data)
        except Exception:
            return None

    def update_session(
        self,
        session_id: str,
        title: str | None = None,
        model: str | None = None,
        pinned_reports: list[str] | None = None,
    ) -> ChatSession | None:
        session = self.get_session(session_id)
        if not session:
            return None
        if title is not None:
            session.title = title
        if model is not None:
            session.model = model
        if pinned_reports is not None:
            session.pinned_reports = pinned_reports
        session.updated_at = time.time()
        self._save(session)
        return session

    def delete_session(self, session_id: str) -> bool:
        path = self._session_path(session_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def add_message(self, session_id: str, role: str, content: str) -> ChatMessage | None:
        session = self.get_session(session_id)
        if not session:
            return None
        msg = ChatMessage(
            role=role,
            content=content,
            timestamp=time.time(),
        )
        session.messages.append(msg)
        session.updated_at = time.time()
        self._save(session)
        return msg

    def get_context_messages(self, session_id: str, max_tokens: int = 12000) -> list[dict]:
        session = self.get_session(session_id)
        if not session:
            return []

        # Build context from pinned reports
        context_parts = []
        for report_path in session.pinned_reports:
            try:
                from backend.app.core.config import REPO_ROOT
                full_path = REPO_ROOT / report_path
                if full_path.is_dir():
                    full_path = full_path / "complete_report.md"
                if full_path.exists():
                    content = full_path.read_text(encoding="utf-8", errors="replace")
                    context_parts.append(f"[Report: {report_path}]\n{content[:6000]}")
            except Exception:
                continue

        messages = []
        if context_parts:
            system_msg = "You are a financial analysis assistant. The user has pinned the following reports as context:\n\n" + "\n\n---\n\n".join(context_parts)
            messages.append({"role": "system", "content": system_msg[:max_tokens]})

        # Add conversation history (most recent first, up to token limit)
        for msg in reversed(session.messages[-20:]):
            messages.insert(1 if context_parts else 0, {"role": msg.role, "content": msg.content})

        return messages

    def _save(self, session: ChatSession) -> None:
        data = session.model_dump()
        self._session_path(session.id).write_text(json.dumps(data, indent=2, default=str))


chat_service = ChatService()
