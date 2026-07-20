from __future__ import annotations

import logging
import platform
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models import User, AIConfig
from app.schemas.settings import (
    SettingsUpdateRequest,
    SettingsResponse,
    TestKeyRequest,
    TestKeyResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["settings"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_create_config(user: User, db: AsyncSession) -> AIConfig:
    result = await db.execute(
        select(AIConfig).where(AIConfig.user_id == user.id)
    )
    config = result.scalar_one_or_none()
    if config:
        return config

    config = AIConfig(
        user_id=user.id,
        default_provider=settings.default_ai_provider,
        default_model=settings.default_model,
        perplefina_url=settings.perplefina_url,
        perplefina_enabled=settings.perplefina_enabled,
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return config


# ---------------------------------------------------------------------------
# Settings endpoints
# ---------------------------------------------------------------------------

@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config = await _get_or_create_config(current_user, db)

    api_keys_configured = {
        "openai": bool(config.openai_api_key_encrypted),
        "anthropic": bool(config.anthropic_api_key_encrypted),
        "google": bool(config.google_api_key_encrypted),
        "deepseek": bool(config.deepseek_api_key_encrypted),
    }

    return SettingsResponse(
        default_provider=config.default_provider,
        default_model=config.default_model,
        default_ticker=config.default_ticker,
        agent_configs=config.agent_configs or {},
        failover_enabled=config.failover_enabled,
        failover_order=config.failover_order or [],
        perplefina_url=config.perplefina_url or settings.perplefina_url,
        perplefina_enabled=config.perplefina_enabled,
        api_keys_configured=api_keys_configured,
    )


@router.patch("/settings", response_model=SettingsResponse)
async def update_settings(
    request: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config = await _get_or_create_config(current_user, db)

    if request.default_provider is not None:
        config.default_provider = request.default_provider
    if request.default_model is not None:
        config.default_model = request.default_model
    if request.default_ticker is not None:
        config.default_ticker = request.default_ticker or None
    if request.agent_configs is not None:
        config.agent_configs = request.agent_configs
    if request.failover_enabled is not None:
        config.failover_enabled = request.failover_enabled
    if request.failover_order is not None:
        config.failover_order = request.failover_order
    if request.openai_api_key is not None:
        config.openai_api_key_encrypted = request.openai_api_key or None
    if request.anthropic_api_key is not None:
        config.anthropic_api_key_encrypted = request.anthropic_api_key or None
    if request.google_api_key is not None:
        config.google_api_key_encrypted = request.google_api_key or None
    if request.deepseek_api_key is not None:
        config.deepseek_api_key_encrypted = request.deepseek_api_key or None
    if request.perplefina_url is not None:
        config.perplefina_url = request.perplefina_url or None
    if request.perplefina_enabled is not None:
        config.perplefina_enabled = request.perplefina_enabled

    await db.commit()
    await db.refresh(config)

    api_keys_configured = {
        "openai": bool(config.openai_api_key_encrypted),
        "anthropic": bool(config.anthropic_api_key_encrypted),
        "google": bool(config.google_api_key_encrypted),
        "deepseek": bool(config.deepseek_api_key_encrypted),
    }

    return SettingsResponse(
        default_provider=config.default_provider,
        default_model=config.default_model,
        default_ticker=config.default_ticker,
        agent_configs=config.agent_configs or {},
        failover_enabled=config.failover_enabled,
        failover_order=config.failover_order or [],
        perplefina_url=config.perplefina_url or settings.perplefina_url,
        perplefina_enabled=config.perplefina_enabled,
        api_keys_configured=api_keys_configured,
    )


# ---------------------------------------------------------------------------
# Test API key
# ---------------------------------------------------------------------------

_KEY_TEST_URLS = {
    "openai": "https://api.openai.com/v1/models",
    "anthropic": "https://api.anthropic.com/v1/messages",
    "google": "https://generativelanguage.googleapis.com/v1/models",
    "deepseek": "https://api.deepseek.com/v1/models",
}


@router.post("/settings/test-key", response_model=TestKeyResponse)
async def test_api_key(request: TestKeyRequest):
    url = _KEY_TEST_URLS.get(request.provider)
    if not url:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {request.provider}")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            if request.provider == "openai":
                resp = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {request.api_key}"},
                )
                if resp.status_code == 200:
                    return TestKeyResponse(valid=True, message="Key is valid")
                return TestKeyResponse(valid=False, message=f"HTTP {resp.status_code}")

            elif request.provider == "anthropic":
                resp = await client.post(
                    url,
                    headers={
                        "x-api-key": request.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-5-haiku-20241022",
                        "max_tokens": 1,
                        "messages": [{"role": "user", "content": "hi"}],
                    },
                )
                if resp.status_code == 200:
                    return TestKeyResponse(valid=True, message="Key is valid")
                body = resp.json()
                msg = body.get("error", {}).get("message", f"HTTP {resp.status_code}")
                return TestKeyResponse(valid=False, message=msg[:120])

            elif request.provider == "google":
                resp = await client.get(
                    f"{url}?key={request.api_key}",
                )
                if resp.status_code == 200:
                    return TestKeyResponse(valid=True, message="Key is valid")
                return TestKeyResponse(valid=False, message=f"HTTP {resp.status_code}")

            elif request.provider == "deepseek":
                resp = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {request.api_key}"},
                )
                if resp.status_code == 200:
                    return TestKeyResponse(valid=True, message="Key is valid")
                return TestKeyResponse(valid=False, message=f"HTTP {resp.status_code}")

    except httpx.TimeoutException:
        return TestKeyResponse(valid=False, message="Request timed out")
    except Exception as e:
        logger.warning(f"Key test failed for {request.provider}: {e}")
        return TestKeyResponse(valid=False, message="Request failed")


# ---------------------------------------------------------------------------
# System health (for settings page)
# ---------------------------------------------------------------------------

@router.get("/settings/health")
async def settings_health():
    try:
        import tradingagents  # noqa: F401
        ta_installed = True
    except ImportError:
        ta_installed = False

    import os
    env_path = os.path.join(os.getcwd(), ".env")
    env_exists = os.path.exists(env_path)

    return {
        "status": "ok" if ta_installed and env_exists else "degraded",
        "python": platform.python_version(),
        "tradingagents": ta_installed,
        "env_file": env_exists,
    }
