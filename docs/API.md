# Backend API Design

## Core Endpoints

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| **Health** | `GET /api/health`, `GET /api/health/detailed`, `POST /api/install_missing` | Setup diagnostics |
| **Config** | `GET /api/analysts`, `GET /api/teams`, `GET /api/section_titles` | Form metadata |
| **Providers/Models** | `GET /api/providers`, `GET /api/models`, `POST /api/test_key` | Provider & model selection |
| **API Keys** | `GET/POST /api/env` | Read/save `.env` |
| **Cost** | `POST /api/estimate`, `GET /api/pricing` | Pre-run cost estimation |
| **Ticker Search** | `GET /api/ticker/search?q={query}` | Yahoo Finance autocomplete with KRX conversion |
| **Runs** | `POST /api/analyze`, `POST /api/stop`, `GET /api/status`, `GET /api/runs`, `GET /api/runs/{id}`, `GET /api/runs/stats`, `GET /api/stream` (SSE), `GET /api/stats` | Run lifecycle + streaming |
| **Reports** | `GET /api/reports`, `GET /api/reports/read`, `GET /api/reports/download`, `POST /api/reports/delete`, `GET /api/reports/export` | Report management |
| **Scheduler** | `GET/POST /api/scheduler/jobs`, `DELETE /api/scheduler/jobs/{id}`, `GET /api/scheduler/jobs/{id}/status` | Cron-based recurring analysis |
| **Memory/RAG** | `GET/POST /api/memory/sync`, `GET /api/memory/status`, `POST /api/memory/obsidian/save`, `GET /api/memory/observations` | ChromaDB + Obsidian vault |
| **Chat** | `GET/POST /api/chat/sessions`, `GET/PATCH/DELETE /api/chat/sessions/{id}`, `POST /api/chat/sessions/{id}/messages` (SSE), `GET /api/chat/models` | Chat with report context |
| **Presets** | `GET/POST /api/presets`, `GET/PATCH/DELETE /api/presets/{id}` | Form presets |
| **UI State** | `GET/POST /api/ui_state` | Persist tab state |

## SSE Event Types

```python
{
  "type": "status|agent_update|chunk|tool_call|message|stats|final_report|debate_transcript|summary_generated|done|error|ping",
  "run_id": "abc123",
  "timestamp": 1234567890,
  # ... event-specific payload
}
```

## Key Backend Services

| # | Service | Responsibility |
|---|---------|---------------|
| 1 | **RunManager** | Concurrent runs, persist to `~/.tradingagents/runs.json` |
| 2 | **EnvStore** | Atomic `.env` read/write with masking |
| 3 | **PresetsStore** | JSON-on-disk preset storage |
| 4 | **UIStateStore** | Persistent config tab state |
| 5 | **ChatSession** | Multi-session chat with report pinning |
| 6 | **CostEstimator** | Token pricing table + pre-run estimation |
| 7 | **AnalysisScheduler** | APScheduler cron with SQLite job store, timezone support, daemon mode |
| 8 | **MemoryService** | ChromaDB RAG (embed → query), Obsidian vault sync |
| 9 | **FactChecker** | URL verification via physical HTTP ping |
| 10 | **DebateExtractor** | Parse raw logs into structured Bull/Bear/Risk/Neutral transcript |
| 11 | **SummaryGenerator** | LLM-based structured report generation |
| 12 | **ProgressTracker** | JSON status file for background job progress |
