from __future__ import annotations

import asyncio
import json
import logging
import time

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from backend.app.core.sse import create_sse_response
from backend.app.services.chat_service import chat_service
from backend.app.models.schemas import ChatSessionSummary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"
    model: str = "gpt-4o-mini"


class UpdateSessionRequest(BaseModel):
    title: str | None = None
    model: str | None = None
    pinned_reports: list[str] | None = None


class SendMessageRequest(BaseModel):
    content: str
    provider: str = "openai"


CHAT_MODELS = [
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai"},
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai"},
    {"id": "claude-sonnet-5", "name": "Claude Sonnet 5", "provider": "anthropic"},
    {"id": "claude-haiku-4-5", "name": "Claude Haiku 4.5", "provider": "anthropic"},
    {"id": "gemini-3.5-flash", "name": "Gemini 3.5 Flash", "provider": "google"},
    {"id": "deepseek-v4-flash", "name": "DeepSeek V4 Flash", "provider": "deepseek"},
    {"id": "grok-4.3", "name": "Grok 4.3", "provider": "xai"},
]


@router.get("/sessions")
async def list_sessions():
    return chat_service.list_sessions()


@router.post("/sessions")
async def create_session(req: CreateSessionRequest):
    return chat_service.create_session(title=req.title, model=req.model).model_dump()


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = chat_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.model_dump()


@router.patch("/sessions/{session_id}")
async def update_session(session_id: str, req: UpdateSessionRequest):
    session = chat_service.update_session(
        session_id,
        title=req.title,
        model=req.model,
        pinned_reports=req.pinned_reports,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.model_dump()


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    if not chat_service.delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}


@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, req: SendMessageRequest, request: Request):
    session = chat_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    chat_service.add_message(session_id, "user", req.content)

    # Build context for LLM
    context = chat_service.get_context_messages(session_id)
    context.append({"role": "user", "content": req.content})

    queue: asyncio.Queue = asyncio.Queue()

    async def _stream_reply():
        try:
            reply = await _call_llm_streaming(
                messages=context,
                model=session.model,
                provider=req.provider,
                queue=queue,
            )
            # Save complete reply
            chat_service.add_message(session_id, "assistant", reply)
            await queue.put({"type": "done"})
        except Exception as e:
            logger.exception("Chat reply failed")
            await queue.put({"type": "error", "error": str(e)})
            await queue.put({"type": "done"})

    asyncio.create_task(_stream_reply())
    return create_sse_response(queue, request)


@router.get("/models")
async def get_chat_models():
    return CHAT_MODELS


async def _call_llm_streaming(
    messages: list[dict],
    model: str,
    provider: str,
    queue: asyncio.Queue,
) -> str:
    """Call LLM with streaming, pushing tokens to the queue."""
    try:
        from tradingagents.llm_clients.factory import create_llm_client
        client = create_llm_client(provider, model)

        # Get the underlying LangChain model
        lc_model = client._get_langchain_model() if hasattr(client, "_get_langchain_model") else None

        if lc_model and hasattr(lc_model, "astream"):
            full_reply = ""
            async for chunk in lc_model.astream(messages):
                token = chunk.content if hasattr(chunk, "content") else str(chunk)
                if token:
                    full_reply += token
                    await queue.put({"type": "token", "content": token})
            return full_reply
        else:
            # Fallback: non-streaming call
            result = await client.ainvoke(messages) if hasattr(client, "ainvoke") else client.invoke(messages)
            reply = result.content if hasattr(result, "content") else str(result)
            await queue.put({"type": "token", "content": reply})
            return reply
    except Exception as e:
        # Fallback to basic HTTP call
        return await _fallback_llm_call(messages, model, provider, queue, e)


async def _fallback_llm_call(
    messages: list[dict],
    model: str,
    provider: str,
    queue: asyncio.Queue,
    original_error: Exception,
) -> str:
    """Fallback LLM call using httpx for providers that support it."""
    import httpx
    from backend.app.services.env_store import env_store

    api_key = env_store.get(f"{provider.upper()}_API_KEY", "")
    if not api_key:
        error_msg = f"No API key for provider '{provider}'. Configure it in Settings → API Keys."
        await queue.put({"type": "token", "content": error_msg})
        return error_msg

    # Simple OpenAI-compatible streaming fallback
    base_url = "https://api.openai.com/v1"
    if provider == "anthropic":
        base_url = "https://api.anthropic.com/v1"
    elif provider == "deepseek":
        base_url = "https://api.deepseek.com/v1"
    elif provider == "xai":
        base_url = "https://api.x.ai/v1"

    full_reply = ""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # For non-OpenAI providers, try OpenAI-compatible endpoint
            resp = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": 4096,
                },
            )
            if resp.status_code != 200:
                error_msg = f"API error {resp.status_code}: {resp.text[:500]}"
                await queue.put({"type": "token", "content": error_msg})
                return error_msg

            # Parse SSE stream
            for line in resp.text.split("\n"):
                if line.startswith("data: "):
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        delta = obj.get("choices", [{}])[0].get("delta", {})
                        token = delta.get("content", "")
                        if token:
                            full_reply += token
                            await queue.put({"type": "token", "content": token})
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        error_msg = f"Failed to connect to {provider}: {e}"
        await queue.put({"type": "token", "content": error_msg})
        return error_msg

    return full_reply
