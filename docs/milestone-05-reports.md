# Milestone 5: Reports Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Build the Reports tab with report list, markdown reader with TOC sidebar, export (MD/HTML/PDF), debate transcript viewer, and auto-summary display.

## Tasks

### Backend
- [ ] `GET /api/reports` — List available reports
- [ ] `GET /api/reports/read` — Read report content
- [ ] `GET /api/reports/download` — Download report as file
- [ ] `POST /api/reports/delete` — Delete report(s)
- [ ] `GET /api/reports/export` — Export in MD/HTML/PDF format
- [ ] `FactChecker` service — URL verification agent

### Frontend
- [ ] `ReportsPage` — Dropdown picker + TOC sidebar + markdown reader + export + debate log viewer
- [ ] `<ReportReader />` — Markdown renderer with TOC navigation, copy, export
- [ ] Integration with `useDebateTranscript(runId)` and `useSummary(runId)`

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

## Definition of Done

- [ ] Reports list shows all available reports with metadata
- [ ] Report reader renders markdown with working TOC sidebar
- [ ] Export works to MD, HTML, and PDF formats
- [ ] Debate transcript viewer shows structured Bull/Bear/Risk/Neutral sections
- [ ] Auto-summary displayed alongside report
- [ ] Fact Checker validates URLs in reports
- [ ] Reports can be deleted from UI
