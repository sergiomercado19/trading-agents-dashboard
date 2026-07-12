from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    ticker: str
    date: str
    analysts: list[str] = Field(default_factory=lambda: ["market", "social", "news", "fundamentals"])
    research_depth: int = 3
    report_brevity: Literal["concise", "standard", "comprehensive"] = "standard"
    provider: str = "openai"
    quick_model: str = "gpt-4o-mini"
    deep_model: str = "gpt-4o"
    data_vendors: dict[str, str] = Field(default_factory=dict)
    checkpoint: bool = False
    clear_checkpoints: bool = False
    output_language: str = "English"


class RunStats(BaseModel):
    llm_calls: int = 0
    tool_calls: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    elapsed_s: float = 0.0


class RunSnapshot(BaseModel):
    run_id: str
    ticker: str
    date: str
    status: Literal["queued", "running", "completed", "stopped", "error"] = "queued"
    started: float = 0.0
    ended: float | None = None
    error: str | None = None
    decision: str | None = None
    agents: dict[str, str] = Field(default_factory=dict)
    reports: dict[str, str] = Field(default_factory=dict)
    stats: RunStats = Field(default_factory=RunStats)


class TickerSuggestion(BaseModel):
    symbol: str
    name: str
    exchange: str
    type: str


class FactCheckResult(BaseModel):
    url: str
    status: Literal["valid", "broken", "protected", "unknown"] = "unknown"
    status_code: int | None = None
    checked_at: float = 0.0


class MemoryStatus(BaseModel):
    collection: str
    note_count: int = 0
    last_synced: str | None = None
    vault_path: str | None = None
    is_docker: bool = False


class ScheduleJob(BaseModel):
    ticker: str
    cron_expr: str
    model: str = "gpt-4o"
    debate_rounds: int = 2
    risk_profile: Literal["conservative", "neutral", "aggressive"] = "neutral"
    timezone: str = "UTC"
    obsidian_path: str | None = None
    enable_obsidian: bool = False


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"


class DetailedHealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    python: str
    tradingagents: bool
    env_file: bool
    required_deps: list[str]
    missing_deps: list[str]


class InstallResponse(BaseModel):
    success: bool
    installed: list[str]
    errors: list[str]
