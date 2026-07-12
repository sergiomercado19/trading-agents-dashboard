# Milestone 6: Memory/RAG Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Implement ChromaDB vector memory integration, Obsidian vault configuration and sync, situation recall visualization, and the `FinancialSituationMemory` service.

## Tasks

### Backend
- [x] `MemoryService` — ChromaDB vector store for RAG
- [x] `GET /api/memory/status` — ChromaDB status, note count, last sync
- [x] `POST /api/memory/vault` — Set Obsidian vault path
- [x] `POST /api/memory/sync` — Trigger vault sync (load `.md` → embed → ChromaDB)
- [x] `POST /api/memory/obsidian/save` — Save report to Obsidian vault
- [x] `GET /api/memory/observations` — Query stored observations
- [x] `POST /api/memory/search` — Similarity search
- [x] Docker mount awareness for vault paths

### Frontend
- [x] `MemoryPage` — Obsidian vault config, chromaDB status, sync button, similarity search viewer
- [x] `<MemoryStatusCard />` — ChromaDB status indicator, note count, last sync time
- [x] `<ObsidianConfig />` — Vault path input with Docker mount awareness and test connection
- [x] `useMemoryStatus()` — Sync status hook
- [x] `useMemories(query)` — Similarity search hook

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `MemoryService` | ChromaDB RAG: embed `.md` files, similarity search, Obsidian sync |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/memory/status` | Memory status |
| POST | `/api/memory/vault` | Set vault path |
| POST | `/api/memory/sync` | Sync vault |
| POST | `/api/memory/obsidian/save` | Save to Obsidian |
| GET | `/api/memory/observations` | Query observations |
| POST | `/api/memory/search` | Similarity search |

## Definition of Done

- [x] ChromaDB collection initializes on first use
- [x] User can configure Obsidian vault path (with Docker awareness)
- [x] Sync loads `.md` files, embeds them, stores in ChromaDB
- [x] Similarity search returns relevant past situations
- [x] Reports auto-save to `TradingAgents/Reports/` in vault
- [x] Note count and last sync time displayed
