from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Agent config (per-agent settings)
# ---------------------------------------------------------------------------

class AgentConfigItem(BaseModel):
    name: str
    phase: str
    max_tokens: int = Field(default=4000, ge=100, le=128000)
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    provider: Optional[str] = None
    model: Optional[str] = None


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class SettingsUpdateRequest(BaseModel):
    """Partial update — only provided fields are written."""
    default_provider: Optional[str] = None
    default_model: Optional[str] = None
    default_ticker: Optional[str] = None
    agent_configs: Optional[dict] = None
    failover_enabled: Optional[bool] = None
    failover_order: Optional[list[str]] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    perplefina_url: Optional[str] = None
    perplefina_enabled: Optional[bool] = None


class TestKeyRequest(BaseModel):
    provider: str = Field(..., min_length=1)
    api_key: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class AgentConfigResponse(BaseModel):
    name: str
    phase: str
    max_tokens: int
    temperature: float
    provider: Optional[str] = None
    model: Optional[str] = None


class SettingsResponse(BaseModel):
    default_provider: str
    default_model: str
    default_ticker: Optional[str] = None
    agent_configs: dict
    failover_enabled: bool
    failover_order: list[str]
    perplefina_url: Optional[str] = None
    perplefina_enabled: bool
    api_keys_configured: dict[str, bool]


class TestKeyResponse(BaseModel):
    valid: bool
    message: str
