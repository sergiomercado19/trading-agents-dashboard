# Milestone 6: Memory/RAG Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Implement ChromaDB vector memory integration, Obsidian vault configuration and sync, situation recall visualization, and the `FinancialSituationMemory` service.

## Tasks

### Backend
- [ ] `MemoryService` — ChromaDB vector store for RAG
- [ ] `GET /api/memory/status` — ChromaDB status, note count, last sync
- [ ] `POST /api/memory/sync` — Trigger vault sync (load `.md` → embed → ChromaDB)
- [ ] `POST /api/memory/obsidian/save` — Save report to Obsidian vault
- [ ] `GET /api/memory/observations` — Query stored observations
- [ ] `FinancialSituationMemory` integration — situation/recommendation pairs
- [ ] Docker mount awareness for vault paths

### Frontend
- [ ] `MemoryPage` — Obsidian vault config, chromaDB status, sync button, similarity search viewer, past-situation recall visualization
- [ ] `<MemoryStatusCard />` — ChromaDB status indicator, note count, last sync time
- [ ] `<ObsidianConfig />` — Vault path input with Docker mount awareness and test connection
- [ ] `useMemoryStatus()` — Sync status hook
- [ ] `useMemories(query)` — Similarity search hook

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `MemoryService` | ChromaDB RAG: embed `.md` files, similarity search, Obsidian sync |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/memory/status` | Memory status |
| POST | `/api/memory/sync` | Sync vault |
| POST | `/api/memory/obsidian/save` | Save to Obsidian |
| GET | `/api/memory/observations` | Query observations |

## Definition of Done

- [ ] ChromaDB collection initializes on first use
- [ ] User can configure Obsidian vault path (with Docker awareness)
- [ ] Sync loads `.md` files, embeds them, stores in ChromaDB
- [ ] Similarity search returns relevant past situations
- [ ] Past-situation recall visualization shows matched observations
- [ ] Reports auto-save to `TradingAgents/Reports/` in vault
- [ ] Note count and last sync time displayed
