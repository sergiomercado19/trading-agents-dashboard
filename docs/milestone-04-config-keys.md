# Milestone 4: Configuration + API Keys

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2 days

## Goal
Build the Configuration tab (provider/model selection, data vendor config, risk profile) and API Keys tab (grouped key inputs, test connection, vault path).

## Tasks

### Backend
- [ ] `POST /api/test_key` — Test API key validity
- [ ] `GET /api/env` — Read current `.env` (masked)
- [ ] `POST /api/env` — Save `.env` values
- [ ] Provider/model validation via `create_llm_client`

### Frontend
- [ ] `ConfigPage` — Provider/model selection + data vendors + risk profile
- [ ] `ApiKeysPage` — Grouped key inputs + test connection + Alpha Vantage + Obsidian vault path
- [ ] `<FactCheckBadge />` — URL verification status indicator (valid/broken/protected)
- [ ] Provider/model dropdowns populated from API
- [ ] Data vendor toggles (18+ sources)
- [ ] Risk profile selector (conservative/neutral/aggressive)
- [ ] Key masking and test button per provider

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/test_key` | Test API key |
| GET | `/api/env` | Read env (masked) |
| POST | `/api/env` | Save env |

## Definition of Done

- [ ] User can select provider and model from live dropdowns
- [ ] 18+ data vendor sources can be toggled on/off
- [ ] Risk profile selector works (conservative/neutral/aggressive)
- [ ] API keys can be entered, tested, and saved
- [ ] Keys are masked when displayed
- [ ] Alpha Vantage and Obsidian vault path configurable
- [ ] Test connection returns success/failure per provider
