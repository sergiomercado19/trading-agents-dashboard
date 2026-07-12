# Milestone 9: Polish

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2 days

## Goal
Theming, presets, UI state persistence, first-run wizard, error boundaries, Docker documentation, and overall fit-and-finish.

## Tasks

### Backend
- [x] `PresetsStore` — JSON-on-disk preset CRUD
- [x] `GET /api/presets` — List presets
- [x] `POST /api/presets` — Create preset
- [x] `GET /api/presets/{id}` — Get preset
- [x] `PATCH /api/presets/{id}` — Update preset
- [x] `DELETE /api/presets/{id}` — Delete preset
- [x] `UIStateStore` — Persistent config tab state
- [x] `GET /api/ui_state` — Load UI state
- [x] `POST /api/ui_state` — Save UI state

### Frontend
- [x] `<ThemeProvider />` — Terminal/Modern/Bloomberg themes
- [x] Theme switching with instant apply (CSS variables)
- [x] Preset save/load in Analyze form
- [x] UI state persistence (active tab, theme) via localStorage + backend
- [x] Error boundaries for all pages (per-tab)
- [x] Loading states, empty states, error states for all components

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `PresetsStore` | JSON-on-disk preset storage |
| `UIStateStore` | Persistent config tab state |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/presets` | List presets |
| POST | `/api/presets` | Create preset |
| GET | `/api/presets/{id}` | Get preset |
| PATCH | `/api/presets/{id}` | Update preset |
| DELETE | `/api/presets/{id}` | Delete preset |
| GET | `/api/ui_state` | Load UI state |
| POST | `/api/ui_state` | Save UI state |

## Definition of Done

- [x] Three themes (Terminal/Modern/Bloomberg) switch instantly
- [x] Presets save/load form state across sessions
- [x] UI state (tab, theme) persists
- [x] Error boundaries catch and display errors gracefully
- [x] All pages have proper loading, empty, and error states
- [x] Docker setup documented in-app (Setup page)
