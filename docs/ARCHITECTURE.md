# Architecture & Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite | Modern, type-safe, excellent ecosystem |
| **Styling** | Tailwind CSS + Radix UI / shadcn-ui | Rapid dev, accessible components, dark mode |
| **State** | TanStack Query (React Query) + Zustand | Server state + lightweight client state |
| **Real-time** | Server-Sent Events (SSE) | Matches TradingAgents-GUI, simpler than WebSockets |
| **Backend** | FastAPI + Uvicorn | Async, type-safe, auto OpenAPI docs |
| **Orchestration** | LangGraph (existing TradingAgentsGraph) | Reuse core analysis engine directly |
| **Vector Store** | ChromaDB | RAG memory for long-term knowledge |
| **Scheduling** | APScheduler + SQLite job store | Cron-based background analysis, daemon mode |
| **Persistence** | SQLite + ChromaDB + `.env` + filesystem | Multi-layered persistence |
| **LLM Providers** | OpenAI, Anthropic, Google GenAI | Multi-provider via langchain |
| **Auth** | None (local-first) | Single-user local tool |

## Project Structure

```
/home/sergio/projects/trading-agents-dashboard/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (9 tabs)
│   │   ├── hooks/          # Custom hooks
│   │   ├── api/            # API client + types
│   │   ├── store/          # Zustand stores
│   │   └── utils/          # Helpers
│   └── package.json
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── main.py         # Entry point
│   │   ├── routes/         # API route modules
│   │   ├── services/       # Business logic
│   │   ├── models/         # Pydantic models
│   │   ├── core/           # Config, SSE, deps
│   │   └── utils/          # Helpers
│   └── pyproject.toml
├── tradingagents/           # Core engine (existing)
├── scheduler_service.py    # APScheduler daemon
├── run_scheduler.py        # Daemon start/stop
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
└── .env.example
```

## Deployment Options

| Target | Command |
|--------|---------|
| **Local dev** | `uvicorn backend.app.main:app --reload --port 8000` + `npm run dev` |
| **Production (single binary)** | Build React → serve static from FastAPI `StaticFiles` |
| **Docker (full stack)** | `docker-compose up --build -d` |
| **Scheduler daemon** | `python run_scheduler.py` (foreground) or `python run_scheduler.py stop` |
| **Desktop (Tauri/Electron)** | Wrap FastAPI + React in native shell |

## Open Questions / Decisions

1. Monorepo structure — Dashboard at repo root; frontend in `./frontend/`, backend in `./backend/`, engine in `./tradingagents/`
2. Python package — Add `backend` as optional extra (`pip install -e ".[web]"`)
3. Auth — None for local; simple token if LAN access needed
4. Background worker — APScheduler suffices; Celery/RQ if web-scale needed
5. Database — SQLite for runs + jobs; ChromaDB for vectors; no migration framework
6. Obsidian/RAG — Any `.md` folder works, not just Obsidian vaults
7. Risk profiles — Conservative/Neutral/Aggressive exposed in UI
8. Data vendor config — Per-vendor API keys managed via .env
