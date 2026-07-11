# Milestone 1: Foundation

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Set up the FastAPI backend skeleton, enable CORS, implement SSE streaming infrastructure, build the RunManager service, EnvStore, and basic health endpoint.

## Tasks

- [ ] FastAPI app skeleton with `main.py`, router registration, CORS middleware
- [ ] `/api/health` and `/api/health/detailed` endpoints
- [ ] `POST /api/install_missing` — install missing Python deps
- [ ] SSE infrastructure (`GET /api/stream`) using `sse_starlette`
- [ ] `RunManager` service — manage concurrent runs, persist to `~/.tradingagents/runs.json`
- [ ] `EnvStore` — atomic `.env` read/write with masking
- [ ] Basic error handling and logging
- [ ] Vite proxy config for `/api` → `localhost:8000`
- [ ] Backend `pyproject.toml` with dependencies (FastAPI, uvicorn, sse-starlette, etc.)

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `RunManager` | Manage concurrent runs, persist to `runs.json` |
| `EnvStore` | Atomic `.env` read/write with masking |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Basic health check |
| GET | `/api/health/detailed` | Detailed diagnostics |
| POST | `/api/install_missing` | Install missing deps |
| GET | `/api/stream` | SSE event stream |

## SSE Event Types Implemented

- `snapshot` — Initial run state
- `ping` — Keep-alive
- `done` — Run completed

## Definition of Done

- [ ] `uvicorn backend.app.main:app --reload` starts without errors
- [ ] `GET /api/health` returns 200
- [ ] SSE stream sends ping events every 20s
- [ ] RunManager creates, tracks, and persists runs
- [ ] EnvStore reads/writes `.env` atomically
- [ ] Frontend proxies `/api` to backend
