# Milestone 8: History + Setup Tabs

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 1-2 days

## Goal
Build the History tab (usage stats, charts, memory log, scheduler audit trail) and the Setup tab (live health checks, install missing deps, Docker info).

## Tasks

### Backend
- [x] `GET /api/history/stats` — Run stats aggregation with charts data
- [x] `GET /api/history/runs` — Run history list
- [x] `GET /api/history/scheduler` — Scheduler audit trail
- [x] `GET /api/history/memory` — Memory sync log
- [x] `GET /api/docker/info` — Docker detection and env path

### Frontend
- [x] `HistoryPage` — Tabbed: Overview / Run History / Scheduler Audit
- [x] Usage stats cards (total, completed, failed, running, cost, tokens)
- [x] Bar chart for runs by date
- [x] Ticker breakdown badges
- [x] Run history table with status, time, cost, tokens
- [x] Scheduler audit trail with job status, last run, errors
- [x] `SetupPage` — Enhanced health checks + Docker info + install missing + quick links
- [x] Health check status cards for each service
- [x] "Install missing" button with progress and result display
- [x] Docker info/status with vault mount guidance

## Definition of Done

- [x] History page shows run statistics with charts
- [x] Cost and token usage charts render correctly
- [x] Memory sync events logged and visible
- [x] Scheduler execution history visible (success/failure)
- [x] Setup page shows live health status for all services
- [x] Missing dependencies can be installed from UI
- [x] Docker info/status displayed
