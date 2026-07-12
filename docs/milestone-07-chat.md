# Milestone 7: Chat Tab

> **⚠️ INSTRUCTION FOR BUILD AGENTS: After completing tasks in this milestone, update [`STATUS.md`](../docs/STATUS.md)**
> — set this milestone to 🟡 In progress or ✅ Completed, fill in dates, and check off any applicable success criteria.

**Est. Effort:** 2-3 days

## Goal
Build the Chat tab with multi-session management, report pinning, model switcher, and streaming LLM replies with report context.

## Tasks

### Backend
- [x] `ChatSession` service — Multi-session chat with report pinning
- [x] `GET /api/chat/sessions` — List chat sessions
- [x] `POST /api/chat/sessions` — Create session
- [x] `GET /api/chat/sessions/{id}` — Get session detail
- [x] `PATCH /api/chat/sessions/{id}` — Update session (rename, pin)
- [x] `DELETE /api/chat/sessions/{id}` — Delete session
- [x] `POST /api/chat/sessions/{id}/messages` — Send message, stream reply via SSE
- [x] `GET /api/chat/models` — List chat-capable models

### Frontend
- [x] `ChatPage` — Session list + thread + pinned reports + model switcher
- [x] Session sidebar with create/rename/delete
- [x] Chat message thread with streaming responses
- [x] Pinned report context indicator
- [x] Model switcher for chat
- [x] `useChatSessions()` — Session CRUD hook
- [x] `useChatSession(id)` — Single session detail hook
- [x] `useChatStream(sessionId, message)` — Streaming reply hook

## Backend Services Created

| Service | Purpose |
|---------|---------|
| `ChatSession` | Multi-session chat, message history, report pinning |

## API Endpoints Delivered

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/chat/sessions` | List sessions |
| POST | `/api/chat/sessions` | Create session |
| GET | `/api/chat/sessions/{id}` | Get session |
| PATCH | `/api/chat/sessions/{id}` | Update session |
| DELETE | `/api/chat/sessions/{id}` | Delete session |
| POST | `/api/chat/sessions/{id}/messages` | Send + stream reply |
| GET | `/api/chat/models` | Chat models |

## Definition of Done

- [x] User can create, rename, and delete chat sessions
- [x] Messages stream in real-time via SSE
- [x] Reports can be pinned to provide context for chat
- [x] Model switcher changes chat LLM
- [x] Chat history persists across sessions and page reloads
- [x] Pinned reports shown as context indicators in the thread
