# Frontend Architecture

## Page Components (9 Tabs)

| Tab | Component | Key Features |
|-----|-----------|--------------|
| **Analyze** | `AnalyzePage` | Form + live pipeline vis + SSE feed + debate viewer |
| **Scheduler** | `SchedulerPage` | Cron job CRUD, timezone, frequency, next-run, progress |
| **Configuration** | `ConfigPage` | Provider/model, data vendors (18+), risk profile |
| **API Keys** | `ApiKeysPage` | Grouped key inputs, test connection, vault path |
| **Reports** | `ReportsPage` | Dropdown picker, TOC sidebar, markdown reader, export, debate log |
| **Memory/RAG** | `MemoryPage` | Obsidian config, ChromaDB status, sync, similarity search |
| **Chat** | `ChatPage` | Session list, thread, pinned reports, model switcher |
| **History** | `HistoryPage` | Usage stats, charts, memory log, scheduler audit trail |
| **Setup** | `SetupPage` | Live health checks, install missing deps, Docker info |

## Core Hooks

```typescript
function useRunStream(runId: string): RunSnapshot | null
function useRuns(): { runs: Run[]; start: (params) => Run; stop: (id) => void }
function useChatSessions(): ChatSession[]
function useChatStream(sessionId: string, message: string): AsyncGenerator<ChatEvent>
function useUIState<T>(key: string, defaultValue: T): [T, (v: T) => void]
function useCostEstimate(formData: AnalyzeForm): CostEstimate
function useTickerSearch(query: string): TickerSuggestion[]
function useSchedulerJobs(): { jobs: SchedulerJob[]; add: (params) => void; remove: (id) => void }
function useMemoryStatus(): { synced: boolean; noteCount: number; lastSync: string }
function useMemories(query: string): MemoryRecall[]
function useDebateTranscript(runId: string): string | null
function useSummary(runId: string): string | null
```

## Key Components

| Component | Purpose |
|-----------|---------|
| `<PipelineVisualization />` | Vertical stages with progress bars |
| `<AgentCard />` | Status: pending/in_progress/completed/error |
| `<MessageFeed />` | Live streaming log with syntax highlighting |
| `<ReportReader />` | Markdown with TOC, copy, export |
| `<CostDisplay />` | Real-time token/cost ticker |
| `<ProviderSelector />` | Grid of provider cards |
| `<ModelSelect />` | Dynamic options (static + live fetch) |
| `<ThemeProvider />` | Terminal/Modern/Bloomberg themes |
| `<TickerSearch />` | Yahoo Finance autocomplete, KRX conversion |
| `<DebateTranscript />` | Bull/Bear/Risk/Neutral viewer with emoji indicators |
| `<SchedulerForm />` | Cron creator with timezone, frequency, preview |
| `<SchedulerJobList />` | Active jobs table with next-run, delete |
| `<MemoryStatusCard />` | ChromaDB status, note count, last sync |
| `<ObsidianConfig />` | Vault path with Docker mount awareness |
| `<FactCheckBadge />` | URL verification status (valid/broken/protected) |

## Real-time Streaming (SSE)

### Backend (FastAPI)

```python
from fastapi import Request
from sse_starlette.sse import EventSourceResponse

@app.get("/api/stream")
async def stream_events(request: Request, run_id: str | None = None):
    run = run_manager.get(run_id)

    async def event_generator():
        yield {"event": "snapshot", "data": json.dumps(run.snapshot())}

        while True:
            if await request.is_disconnected():
                break
            try:
                event = await run.queue.get(timeout=20)
                yield {"event": event["type"], "data": json.dumps(event)}
                if event["type"] == "done":
                    break
            except asyncio.TimeoutError:
                yield {"event": "ping", "data": "{}"}

    return EventSourceResponse(event_generator())
```

### Frontend (React)

```typescript
function useRunStream(runId: string) {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/stream?run_id=${runId}`);
    es.addEventListener("snapshot", (e) => setSnapshot(JSON.parse(e.data)));
    es.addEventListener("agent_update", (e) => updateAgentStatus(JSON.parse(e.data)));
    es.addEventListener("stats", (e) => updateStats(JSON.parse(e.data)));
    es.addEventListener("done", () => es.close());
    return () => es.close();
  }, [runId]);

  return snapshot;
}
```

## Vite Proxy Config

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/static': { target: 'http://localhost:8000' },
    }
  }
})
```
