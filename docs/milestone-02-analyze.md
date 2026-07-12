# Milestone 2: Analyze Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 3-4 days

## Goal
Build the core analysis workflow: form submission, cost estimation, start/stop runs, live SSE pipeline visualization, message feed, and ticker search.

## Tasks

### Backend
- [x] `POST /api/analyze` — Start analysis run
- [x] `POST /api/stop` — Stop running analysis
- [x] `GET /api/status` — Get run status
- [x] `GET /api/runs` — List all runs
- [x] `GET /api/runs/{id}` — Get specific run
- [x] `GET /api/runs/stats` — Aggregate run statistics
- [x] `GET /api/stats` — System stats
- [x] `POST /api/estimate` — Pre-run cost estimation
- [x] `GET /api/pricing` — Token pricing table
- [x] `GET /api/ticker/search?q={query}` — Yahoo Finance ticker autocomplete with KRX auto-conversion
- [x] `GET /api/analysts`, `GET /api/teams`, `GET /api/section_titles` — Form metadata
- [x] `GET /api/providers`, `GET /api/models` — Provider/model listings
- [x] `CostEstimator` service — token pricing + pre-run estimation
- [x] `DebateExtractor` — parse raw logs into structured debate transcript
- [x] `SummaryGenerator` — LLM-based structured report generation

### Frontend
- [x] `AnalyzePage` — Form + live pipeline visualization + SSE feed + debate viewer
- [x] `<PipelineVisualization />` — Vertical stages with progress bars
- [x] `<AgentCard />` — Status: pending/in_progress/completed/error
- [x] `<MessageFeed />` — Live streaming log with syntax highlighting
- [x] `<CostDisplay />` — Real-time token/cost ticker
- [x] `<ProviderSelector />` — Grid of provider cards
- [x] `<ModelSelect />` — Dynamic options (static + live fetch)
- [x] `<TickerSearch />` — Autocomplete with Yahoo Finance API, KRX conversion
- [x] `<DebateTranscript />` — Structured Bull/Bear/Risk/Neutral viewer
- [x] `useRunStream(runId)` — SSE connection with auto-reconnect
- [x] `useRuns()` — Run management (list, start, stop)
- [x] `useCostEstimate(formData)` — Debounced cost estimation
- [x] `useTickerSearch(query)` — Debounced autocomplete search
- [x] `useDebateTranscript(runId)` — Fetch debate transcript
- [x] `useSummary(runId)` — Fetch auto-summary

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `CostEstimator` | Token pricing table + pre-run estimation |
| `DebateExtractor` | Parse logs into structured debate transcript |
| `SummaryGenerator` | LLM-based report generation from execution logs |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/analyze` | Start analysis |
| POST | `/api/stop` | Stop running analysis |
| GET | `/api/status` | Run status |
| GET | `/api/runs` | List runs |
| GET | `/api/runs/{id}` | Get run detail |
| GET | `/api/runs/stats` | Run statistics |
| GET | `/api/stats` | System stats |
| POST | `/api/estimate` | Cost estimation |
| GET | `/api/pricing` | Pricing table |
| GET | `/api/ticker/search` | Ticker autocomplete |
| GET | `/api/analysts` | Analyst list |
| GET | `/api/teams` | Team list |
| GET | `/api/section_titles` | Section titles |

## Definition of Done

- [x] User can enter ticker, select analysts/provider/models, and start analysis
- [x] SSE stream delivers real-time agent updates, messages, and stats
- [x] Pipeline visualization shows progress through stages
- [x] Ticker search autocompletes with Yahoo Finance (including KRX)
- [x] Cost estimate shown before run starts
- [x] Debate transcript renders after run completes
- [x] Summary generated after run completes
- [x] User can stop a running analysis
- [x] Run history persists across page refreshes
