from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request / Response
# ---------------------------------------------------------------------------

class AnalysisRequest(BaseModel):
    ticker: str
    date: str = ""
    analysts: list[str] = Field(
        default_factory=lambda: ["market", "news", "social", "fundamentals"]
    )
    research_depth: int = Field(default=3, ge=1, le=10)
    provider: str = "openai"
    model: str = "gpt-4o-mini"


class AnalysisStartResponse(BaseModel):
    analysis_id: int
    status: str


# ---------------------------------------------------------------------------
# SSE events
# ---------------------------------------------------------------------------

class AgentEvent(BaseModel):
    type: Literal["agent_update"] = "agent_update"
    analysis_id: int
    agent: str
    phase: str
    status: str
    message: str = ""


class ProgressEvent(BaseModel):
    type: Literal["progress"] = "progress"
    analysis_id: int
    phase: str
    progress: int
    total_agents: int
    completed_agents: int


class AnalysisDoneEvent(BaseModel):
    type: Literal["done"] = "done"
    analysis_id: int


class AnalysisErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    analysis_id: int
    error: str


class AnalysisResultEvent(BaseModel):
    type: Literal["result"] = "result"
    analysis_id: int
    ticker: str
    recommendation: str = ""
    confidence: float = 0.0
    risk_score: float = 0.0
    summary: str = ""
    agents: list[dict] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Agent output schemas
# ---------------------------------------------------------------------------

class AgentOutput(BaseModel):
    agent_name: str
    phase: str
    content: str
    tokens_used: int = 0
    cost_usd: float = 0.0
    duration_ms: int = 0
    metadata: dict = Field(default_factory=dict)
