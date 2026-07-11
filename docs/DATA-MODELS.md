# Data Models (Pydantic + TypeScript)

## Shared Types

```python
# Backend models (Pydantic)
class AnalyzeRequest(BaseModel):
    ticker: str
    date: str
    analysts: list[str]  # ["market", "social", "news", "fundamentals"]
    research_depth: int  # 1, 3, 5
    report_brevity: Literal["concise", "standard", "comprehensive"]
    provider: str
    quick_model: str
    deep_model: str
    data_vendors: dict[str, str]
    checkpoint: bool
    clear_checkpoints: bool
    output_language: str


class RunSnapshot(BaseModel):
    run_id: str
    ticker: str
    date: str
    status: Literal["queued", "running", "completed", "stopped", "error"]
    started: float
    ended: float | None
    error: str | None
    decision: str | None
    agents: dict[str, str]  # agent_name -> status
    reports: dict[str, str]  # section_key -> content
    stats: RunStats


class RunStats(BaseModel):
    llm_calls: int
    tool_calls: int
    tokens_in: int
    tokens_out: int
    cost_usd: float
    elapsed_s: float


class ScheduleJob(BaseModel):
    ticker: str
    cron_expr: str
    model: str = "gpt-4o"
    debate_rounds: int = 2
    risk_profile: Literal["conservative", "neutral", "aggressive"] = "neutral"
    timezone: str = "UTC"
    obsidian_path: str | None = None
    enable_obsidian: bool = False


class TickerSuggestion(BaseModel):
    symbol: str
    name: str
    exchange: str
    type: str  # equity, etf, etc.


class MemoryStatus(BaseModel):
    collection: str
    note_count: int
    last_synced: str | None
    vault_path: str | None
    is_docker: bool


class FactCheckResult(BaseModel):
    url: str
    status: Literal["valid", "broken", "protected", "unknown"]
    status_code: int | None
    checked_at: float
```

TypeScript types generated from Pydantic via `pydantic2ts` or maintained manually.
