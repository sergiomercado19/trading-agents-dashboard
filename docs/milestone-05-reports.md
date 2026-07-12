# Milestone 5: Reports Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Build the Reports tab with report list, markdown reader with TOC sidebar, export (MD/HTML/PDF), debate transcript viewer, and auto-summary display.

## Tasks

### Backend
- [x] `GET /api/reports` — List available reports
- [x] `GET /api/reports/read` — Read report content
- [x] `GET /api/reports/download` — Download report as file
- [x] `POST /api/reports/delete` — Delete report(s)
- [x] `GET /api/reports/export` — Export in MD/HTML/PDF format
- [x] `GET /api/reports/check_urls` — URL verification
- [x] `FactChecker` service — URL verification agent

### Frontend
- [x] `ReportsPage` — Report list sidebar + report/debate toggle + export + URL check + delete
- [x] `<ReportReader />` — Markdown renderer with TOC sidebar navigation, copy, export
- [x] `DebateTranscript` — Structured Bull/Bear/Risk/Neutral sections with speaker attribution
- [x] Integration with `useDebateTranscript(runId)` and `useSummary(runId)`

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `FactChecker` | URL verification via physical HTTP ping |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/reports` | List reports |
| GET | `/api/reports/read` | Read report |
| GET | `/api/reports/download` | Download report |
| POST | `/api/reports/delete` | Delete report |
| GET | `/api/reports/export` | Export (MD/HTML/PDF) |
| GET | `/api/reports/check_urls` | Verify URLs in report |

## Definition of Done

- [x] Reports list shows all available reports with metadata
- [x] Report reader renders markdown with working TOC sidebar
- [x] Export works to MD, HTML, and PDF formats
- [x] Debate transcript viewer shows structured Bull/Bear/Risk/Neutral sections
- [x] Auto-summary displayed alongside report
- [x] Fact Checker validates URLs in reports
- [x] Reports can be deleted from UI
