from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Mapping from agent names to Perplexica focus modes
AGENT_FOCUS_MODE: dict[str, str] = {
    "market_analyst": "webSearch",
    "news_analyst": "news",
    "social_analyst": "social",
    "fundamentals_analyst": "fundamentals",
    "macro_analyst": "macroEconomy",
}


async def search_perplefina(
    query: str,
    focus_mode: str = "webSearch",
    max_sources: int = 10,
    timeout: float = 60.0,
) -> dict[str, Any]:
    """Search Perplexica and return the answer + sources.

    Returns ``{"answer": str, "sources": list}``.
    On any error returns ``{"answer": "", "sources": [], "error": str}``.
    """
    url = f"{settings.perplefina_url.rstrip('/')}/api/search"

    payload = {
        "query": query,
        "focusMode": focus_mode,
        "optimizationMode": "balanced",
        "history": [],
        "stream": False,
        "maxSources": max_sources,
        "maxToken": 4000,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return {
            "answer": data.get("message", ""),
            "sources": data.get("sources", []),
        }
    except httpx.TimeoutException:
        logger.warning("Perplexica timeout for focus_mode=%s query=%s", focus_mode, query[:80])
        return {"answer": "", "sources": [], "error": "timeout"}
    except Exception:
        logger.exception("Perplexica request failed for focus_mode=%s", focus_mode)
        return {"answer": "", "sources": [], "error": "request failed"}


async def fetch_agent_context(ticker: str, agent_name: str, date: str = "") -> str:
    """Fetch relevant web context from Perplexica for a specific agent.

    Returns a formatted string the agent can embed in its LLM prompt.
    """
    focus = AGENT_FOCUS_MODE.get(agent_name)
    if not focus:
        return ""

    query = _build_query(ticker, agent_name, date)
    result = await search_perplefina(query, focus_mode=focus)

    answer = result.get("answer", "")
    sources = result.get("sources", [])

    if not answer and not sources:
        return ""

    parts: list[str] = []
    if answer:
        parts.append(answer)
    if sources:
        source_lines = []
        for s in sources[:5]:
            title = s.get("title", "")
            url = s.get("url", "")
            snippet = s.get("snippet", s.get("description", ""))
            line = f"- {title}"
            if snippet:
                line += f": {snippet}"
            if url:
                line += f" ({url})"
            source_lines.append(line)
        if source_lines:
            parts.append("Sources:\n" + "\n".join(source_lines))

    return "\n\n".join(parts)


def _build_query(ticker: str, agent_name: str, date: str) -> str:
    """Build a Perplexica search query tailored to the agent type."""
    date_clause = f" as of {date}" if date else ""

    queries = {
        "market_analyst": f"{ticker} stock technical analysis price action support resistance{date_clause}",
        "news_analyst": f"{ticker} stock news catalysts earnings regulatory{date_clause}",
        "social_analyst": f"{ticker} stock social media sentiment reddit twitter retail investors{date_clause}",
        "fundamentals_analyst": f"{ticker} stock financial statements valuation revenue earnings{date_clause}",
        "macro_analyst": f"{ticker} stock macro economic environment interest rates inflation sector trends{date_clause}",
    }
    return queries.get(agent_name, f"{ticker} stock analysis{date_clause}")
