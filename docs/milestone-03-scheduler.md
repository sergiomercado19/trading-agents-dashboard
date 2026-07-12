# Milestone 3: Scheduler Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Implement APScheduler-based cron job management with timezone support, daemon mode, progress tracking, and a full scheduler UI.

## Tasks

### Backend
- [x] `AnalysisScheduler` service — APScheduler with SQLite job store
- [x] `GET /api/scheduler/jobs` — List scheduled jobs
- [x] `POST /api/scheduler/jobs` — Create scheduled job
- [x] `DELETE /api/scheduler/jobs/{id}` — Remove scheduled job
- [x] `GET /api/scheduler/jobs/{id}/status` — Get job status/progress
- [x] `ProgressTracker` — JSON status file writer/reader for background job progress
- [x] `scheduler_service.py` — APScheduler daemon
- [x] `run_scheduler.py` — Start/stop daemon with PID file
- [x] Timezone-aware scheduling (pytz/zoneinfo)
- [x] Human-readable next-run computation
- [x] Daemon mode: foreground (`run_scheduler.py`) and background (`run_scheduler.py stop`)

### Frontend
- [x] `SchedulerPage` — Cron job management UI
- [x] `<SchedulerForm />` — Job creator with timezone picker, frequency config, day-of-week multiselect, human-readable preview
- [x] `<SchedulerJobList />` — Active jobs table with next-run, delete button
- [x] `useSchedulerJobs()` — Job CRUD hook
- [x] Progress tracking display for running scheduled jobs

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `AnalysisScheduler` | APScheduler cron with SQLite job store, timezone support |
| `ProgressTracker` | JSON status file writer/reader for background jobs |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/scheduler/jobs` | List jobs |
| POST | `/api/scheduler/jobs` | Create job |
| DELETE | `/api/scheduler/jobs/{id}` | Delete job |
| GET | `/api/scheduler/jobs/{id}/status` | Job progress |

## Definition of Done

- [x] User can create a cron job with ticker, frequency, timezone
- [x] Human-readable next-run preview shown before saving
- [x] Active jobs listed with next-run time in user's timezone
- [x] Jobs can be deleted
- [x] Scheduler daemon runs independently (`run_scheduler.py`)
- [x] Daemon can be stopped gracefully (`run_scheduler.py stop`)
- [x] Progress tracking visible during background job execution
- [x] Jobs persist across daemon restarts (SQLite job store)
