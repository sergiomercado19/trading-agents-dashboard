# Milestone 2: Analyze Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 3-4 days

## Goal
Build the core analysis workflow: form submission, cost estimation, start/stop runs, live SSE pipeline visualization, message feed, and ticker search.

## Tasks

### Backend
- [ ] `POST /api/analyze` — Start analysis run
- [ ] `POST /api/stop` — Stop running analysis
- [ ] `GET /api/status` — Get run status
- [ ] `GET /api/runs` — List all runs
- [ ] `GET /api/runs/{id}` — Get specific run
- [ ] `GET /api/runs/stats` — Aggregate run statistics
- [ ] `GET /api/stats` — System stats
- [ ] `POST /api/estimate` — Pre-run cost estimation
- [ ] `GET /api/pricing` — Token pricing table
- [ ] `GET /api/ticker/search?q={query}` — Yahoo Finance ticker autocomplete with KRX auto-conversion
- [ ] `GET /api/analysts`, `GET /api/teams`, `GET /api/section_titles` — Form metadata
- [ ] `GET /api/providers`, `GET /api/models` — Provider/model listings
- [ ] `CostEstimator` service — token pricing + pre-run estimation
- [ ] `DebateExtractor` — parse raw logs into structured debate transcript
- [ ] `SummaryGenerator` — LLM-based structured report generation

### Frontend
- [ ] `AnalyzePage` — Form + live pipeline visualization + SSE feed + debate viewer
- [ ] `<PipelineVisualization />` — Vertical stages with progress bars
- [ ] `<AgentCard />` — Status: pending/in_progress/completed/error
- [ ] `<MessageFeed />` — Live streaming log with syntax highlighting
- [ ] `<CostDisplay />` — Real-time token/cost ticker
- [ ] `<ProviderSelector />` — Grid of provider cards
- [ ] `<ModelSelect />` — Dynamic options (static + live fetch)
- [ ] `<TickerSearch />` — Autocomplete with Yahoo Finance API, KRX conversion
- [ ] `<DebateTranscript />` — Structured Bull/Bear/Risk/Neutral viewer
- [ ] `useRunStream(runId)` — SSE connection with auto-reconnect
- [ ] `useRuns()` — Run management (list, start, stop)
- [ ] `useCostEstimate(formData)` — Debounced cost estimation
- [ ] `useTickerSearch(query)` — Debounced autocomplete search
- [ ] `useDebateTranscript(runId)` — Fetch debate transcript
- [ ] `useSummary(runId)` — Fetch auto-summary

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

- [ ] User can enter ticker, select analysts/provider/models, and start analysis
- [ ] SSE stream delivers real-time agent updates, messages, and stats
- [ ] Pipeline visualization shows progress through stages
- [ ] Ticker search autocompletes with Yahoo Finance (including KRX)
- [ ] Cost estimate shown before run starts
- [ ] Debate transcript renders after run completes
- [ ] Summary generated after run completes
- [ ] User can stop a running analysis
- [ ] Run history persists across page refreshes
