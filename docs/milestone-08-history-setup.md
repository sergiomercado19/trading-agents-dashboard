# Milestone 8: History + Setup Tabs

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 1-2 days

## Goal
Build the History tab (usage stats, charts, memory log, scheduler audit trail) and the Setup tab (live health checks, install missing deps, Docker info).

## Tasks

### Backend
- [ ] Run stats aggregation endpoints (reuse from M2)
- [ ] Memory log and scheduler audit trail data
- [ ] Health check enhancements for all services

### Frontend
- [ ] `HistoryPage` — Usage stats + charts + memory log + scheduler audit trail
- [ ] Usage charts (runs over time, cost over time, token usage)
- [ ] Memory log of sync events and queries
- [ ] Scheduler audit trail (job executions, failures)
- [ ] `SetupPage` — Live health checks + install missing deps + Docker info
- [ ] Health check status cards for each service
- [ ] "Install missing" button with progress
- [ ] Docker setup instructions / status

## Definition of Done

- [ ] History page shows run statistics with charts
- [ ] Cost and token usage charts render correctly
- [ ] Memory sync events logged and visible
- [ ] Scheduler execution history visible (success/failure)
- [ ] Setup page shows live health status for all services
- [ ] Missing dependencies can be installed from UI
- [ ] Docker info/status displayed
