# TradingAgents Web UI — Implementation Plan

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing any work, update [`STATUS.md`](./STATUS.md)**
> — bump the date, mark milestones started/completed, check off success criteria.
> Also update the definition-of-done checklist in the relevant milestone file.

**Build a modern React + FastAPI frontend for the TradingAgents CLI-only framework.**

---

## Reference Docs

| Document | Contents |
|----------|----------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Tech stack, project structure, deployment options, open decisions |
| [`API.md`](./API.md) | All REST endpoints, SSE event types, backend service catalog |
| [`FRONTEND.md`](./FRONTEND.md) | Page components, hooks, component catalog, SSE implementation |
| [`DATA-MODELS.md`](./DATA-MODELS.md) | Pydantic models (AnalyzeRequest, RunSnapshot, ScheduleJob, etc.) |
| [`WORKFLOW.md`](./WORKFLOW.md) | Setup commands, prerequisites, mise, skills |
| [`INTEGRATION.md`](./INTEGRATION.md) | Existing TradingAgents modules to reuse |

## Milestones

| # | Milestone | Effort | Link |
|---|-----------|--------|------|
| 1 | Foundation — FastAPI skeleton, CORS, SSE, RunManager, EnvStore | 2-3 days | [`milestone-01-foundation.md`](./milestone-01-foundation.md) |
| 2 | Analyze Tab — Form, cost estimate, SSE pipeline, ticker search | 3-4 days | [`milestone-02-analyze.md`](./milestone-02-analyze.md) |
| 3 | Scheduler Tab — APScheduler cron, daemon, progress tracking | 2-3 days | [`milestone-03-scheduler.md`](./milestone-03-scheduler.md) |
| 4 | Config + API Keys — Providers, vendors, risk profile, keys | 2 days | [`milestone-04-config-keys.md`](./milestone-04-config-keys.md) |
| 5 | Reports Tab — Markdown reader, export, debate viewer | 2-3 days | [`milestone-05-reports.md`](./milestone-05-reports.md) |
| 6 | Memory/RAG Tab — ChromaDB, Obsidian sync, situation recall | 2-3 days | [`milestone-06-memory.md`](./milestone-06-memory.md) |
| 7 | Chat Tab — Sessions, pin reports, streaming replies | 2-3 days | [`milestone-07-chat.md`](./milestone-07-chat.md) |
| 8 | History + Setup — Stats, charts, health checks | 1-2 days | [`milestone-08-history-setup.md`](./milestone-08-history-setup.md) |
| 9 | Polish — Themes, presets, wizard, error boundaries | 2 days | [`milestone-09-polish.md`](./milestone-09-polish.md) |

**Total: ~18-23 days**

## Overview

The architecture is a standard two-tier web app:

- **Backend**: FastAPI + Uvicorn serving REST endpoints and SSE streams
- **Frontend**: React 18 + TypeScript + Vite with Tailwind CSS / Radix UI
- **Reuse**: Core `tradingagents/` engine (LangGraph, agents, dataflows) imported directly
- **State**: TanStack Query (server) + Zustand (client)
- **Real-time**: SSE (simpler than WebSockets, matches original GUI approach)
- **Scheduling**: APScheduler daemon for cron-based background analysis
- **Memory**: ChromaDB vector store for RAG and situation recall

Each milestone file contains the full breakdown: specific tasks, backend services to create, API endpoints to deliver, frontend components and hooks, and a definition-of-done checklist.
