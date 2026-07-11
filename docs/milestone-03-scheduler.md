# Milestone 3: Scheduler Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Implement APScheduler-based cron job management with timezone support, daemon mode, progress tracking, and a full scheduler UI.

## Tasks

### Backend
- [ ] `AnalysisScheduler` service — APScheduler with SQLite job store
- [ ] `GET /api/scheduler/jobs` — List scheduled jobs
- [ ] `POST /api/scheduler/jobs` — Create scheduled job
- [ ] `DELETE /api/scheduler/jobs/{id}` — Remove scheduled job
- [ ] `GET /api/scheduler/jobs/{id}/status` — Get job status/progress
- [ ] `ProgressTracker` — JSON status file writer/reader for background job progress
- [ ] `scheduler_service.py` — APScheduler daemon
- [ ] `run_scheduler.py` — Start/stop daemon with PID file
- [ ] Timezone-aware scheduling (pytz/zoneinfo)
- [ ] Human-readable next-run computation
- [ ] Daemon mode: foreground (`run_scheduler.py`) and background (`run_scheduler.py stop`)

### Frontend
- [ ] `SchedulerPage` — Cron job management UI
- [ ] `<SchedulerForm />` — Job creator with timezone picker, frequency config, day-of-week multiselect, human-readable preview
- [ ] `<SchedulerJobList />` — Active jobs table with next-run, delete button
- [ ] `useSchedulerJobs()` — Job CRUD hook
- [ ] Progress tracking display for running scheduled jobs

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

- [ ] User can create a cron job with ticker, frequency, timezone
- [ ] Human-readable next-run preview shown before saving
- [ ] Active jobs listed with next-run time in user's timezone
- [ ] Jobs can be deleted
- [ ] Scheduler daemon runs independently (`run_scheduler.py`)
- [ ] Daemon can be stopped gracefully (`run_scheduler.py stop`)
- [ ] Progress tracking visible during background job execution
- [ ] Jobs persist across daemon restarts (SQLite job store)
