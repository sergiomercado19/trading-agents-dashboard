# Development Workflow

## Version Management (`mise`)

This repository uses [`mise`](https://mise.jdx.dev) for tool version management (Python 3.12 + virtual env). Config is in [`mise.toml`](../mise.toml). After installing `mise`, run:

```bash
mise install
```

## Skills

This project adheres to these custom skills during development:

- **`/impeccable`** — ensures frontend code meets high standards (linting, type safety, error boundaries, a11y)
- **`/frontend-design`** — guides UI/UX decisions with Radix/shadcn primitives, dark-mode-first theming, responsive layout, accessibility

Both skills should be consulted when working on any frontend (React) code.

## Prerequisites

- Python 3.12+ (managed via `mise`)
- Node.js 18+
- TradingAgents core installed (`pip install -e .`)
- `mise` installed and configured (see [mise.jdx.dev](https://mise.jdx.dev))

## Setup Commands

```bash
# Bootstrap tools and venv (mise)
mise install

# Backend
cd backend
pip install -e .  # fastapi, uvicorn, sse-starlette, chromadb, apscheduler, etc.
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev  # Vite dev server on :5173, proxies /api to :8000

# Scheduler daemon (optional, for background jobs)
python run_scheduler.py  # foreground
python run_scheduler.py stop  # stop daemon

# Docker (full stack)
docker-compose up --build -d
```
