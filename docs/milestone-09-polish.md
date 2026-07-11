# Milestone 9: Polish

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2 days

## Goal
Theming, presets, UI state persistence, first-run wizard, error boundaries, Docker documentation, and overall fit-and-finish.

## Tasks

### Backend
- [ ] `PresetsStore` — JSON-on-disk preset CRUD
- [ ] `GET/POST /api/presets` — List/create presets
- [ ] `GET/PATCH/DELETE /api/presets/{id}` — Get/update/delete preset
- [ ] `UIStateStore` — Persistent config tab state
- [ ] `GET/POST /api/ui_state` — Save/load UI state

### Frontend
- [ ] `<ThemeProvider />` — Terminal/Modern/Bloomberg themes
- [ ] Theme switching with instant apply
- [ ] Preset save/load in Analyze form
- [ ] UI state persistence (active tab, form state, panel sizes)
- [ ] First-run wizard guiding user through setup
- [ ] Error boundaries for all pages
- [ ] Loading states, empty states, error states for all components
- [ ] Docker documentation in Setup tab
- [ ] Responsive layout adjustments

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

- [ ] Three themes (Terminal/Modern/Bloomberg) switch instantly
- [ ] Presets save/load form state across sessions
- [ ] UI state (tab, form fields, panel sizes) persists
- [ ] First-run wizard gets user from zero to first analysis in < 2 min
- [ ] Error boundaries catch and display errors gracefully
- [ ] All pages have proper loading, empty, and error states
- [ ] Responsive layout works at common screen sizes
- [ ] Docker setup documented in-app
