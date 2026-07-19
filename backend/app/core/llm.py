from __future__ import annotations

import time
import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# LLM provider abstraction
# ---------------------------------------------------------------------------

_OPENAI_URL = "https://api.openai.com/v1/chat/completions"
_ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
_GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def call_llm(
    prompt: str,
    system: str = "",
    provider: str | None = None,
    model: str | None = None,
    max_tokens: int = 4000,
    temperature: float = 0.3,
) -> tuple[str, int, int]:
    """Call an LLM provider and return (content, tokens_in, tokens_out)."""
    provider = provider or settings.default_ai_provider
    model = model or settings.default_model

    if provider == "openai":
        return await _call_openai(prompt, system, model, max_tokens, temperature)
    elif provider == "anthropic":
        return await _call_anthropic(prompt, system, model, max_tokens, temperature)
    elif provider == "google":
        return await _call_google(prompt, system, model, max_tokens, temperature)
    elif provider == "nvidia":
        return await _call_nvidia(prompt, system, model, max_tokens, temperature)
    elif provider == "openrouter":
        return await _call_openrouter(prompt, system, model, max_tokens, temperature)
    else:
        raise ValueError(f"Unknown provider: {provider}")


async def _call_openai(
    prompt: str, system: str, model: str, max_tokens: int, temperature: float
) -> tuple[str, int, int]:
    api_key = settings.openai_api_key
    if not api_key:
        raise ValueError("OpenAI API key not configured")

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            _OPENAI_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": temperature},
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    tokens_in = usage.get("prompt_tokens", 0)
    tokens_out = usage.get("completion_tokens", 0)
    return content, tokens_in, tokens_out


async def _call_anthropic(
    prompt: str, system: str, model: str, max_tokens: int, temperature: float
) -> tuple[str, int, int]:
    api_key = settings.anthropic_api_key
    if not api_key:
        raise ValueError("Anthropic API key not configured")

    body: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        body["system"] = system

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            _ANTHROPIC_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["content"][0]["text"]
    usage = data.get("usage", {})
    tokens_in = usage.get("input_tokens", 0)
    tokens_out = usage.get("output_tokens", 0)
    return content, tokens_in, tokens_out


async def _call_google(
    prompt: str, system: str, model: str, max_tokens: int, temperature: float
) -> tuple[str, int, int]:
    api_key = settings.google_api_key
    if not api_key:
        raise ValueError("Google API key not configured")

    contents = []
    if system:
        contents.append({"role": "user", "parts": [{"text": system}]})
        contents.append({"role": "model", "parts": [{"text": "Understood."}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    url = _GOOGLE_URL.format(model=model) + f"?key={api_key}"

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": contents,
                "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
            },
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["candidates"][0]["content"]["parts"][0]["text"]
    usage = data.get("usageMetadata", {})
    tokens_in = usage.get("promptTokenCount", 0)
    tokens_out = usage.get("candidatesTokenCount", 0)
    return content, tokens_in, tokens_out


async def _call_nvidia(
    prompt: str, system: str, model: str, max_tokens: int, temperature: float
) -> tuple[str, int, int]:
    api_key = settings.nvidia_api_key
    if not api_key:
        raise ValueError("NVIDIA API key not configured")

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            _NVIDIA_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": temperature},
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    tokens_in = usage.get("prompt_tokens", 0)
    tokens_out = usage.get("completion_tokens", 0)
    return content, tokens_in, tokens_out


async def _call_openrouter(
    prompt: str, system: str, model: str, max_tokens: int, temperature: float
) -> tuple[str, int, int]:
    api_key = settings.openrouter_api_key
    if not api_key:
        raise ValueError("OpenRouter API key not configured")

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            _OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "TradingAgents Dashboard",
            },
            json={"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": temperature},
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    tokens_in = usage.get("prompt_tokens", 0)
    tokens_out = usage.get("completion_tokens", 0)
    return content, tokens_in, tokens_out
