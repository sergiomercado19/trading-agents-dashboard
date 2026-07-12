# Milestone 4: Configuration + API Keys

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2 days

## Goal
Build the Configuration tab (provider/model selection, data vendor config, risk profile) and API Keys tab (grouped key inputs, test connection, vault path).

## Tasks

### Backend
- [x] `POST /api/test_key` — Test API key validity
- [x] `GET /api/env` — Read current `.env` (masked)
- [x] `POST /api/env` — Save `.env` values
- [x] Provider/model validation via `create_llm_client`

### Frontend
- [x] `ConfigPage` — Provider/model selection + data vendors + risk profile
- [x] `ApiKeysPage` — Grouped key inputs + test connection + Alpha Vantage + Obsidian vault path
- [x] `<FactCheckBadge />` — URL verification status indicator (valid/broken/protected)
- [x] Provider/model dropdowns populated from API
- [x] Data vendor toggles (18+ sources)
- [x] Risk profile selector (conservative/neutral/aggressive)
- [x] Key masking and test button per provider

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/test_key` | Test API key |
| GET | `/api/env` | Read env (masked) |
| POST | `/api/env` | Save env |

## Definition of Done

- [x] User can select provider and model from live dropdowns
- [x] 18+ data vendor sources can be toggled on/off
- [x] Risk profile selector works (conservative/neutral/aggressive)
- [x] API keys can be entered, tested, and saved
- [x] Keys are masked when displayed
- [x] Alpha Vantage and Obsidian vault path configurable
- [x] Test connection returns success/failure per provider
