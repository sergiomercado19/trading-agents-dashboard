from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["providers"])

PROVIDERS = [
    {"id": "openai", "name": "OpenAI", "requires_key": True, "env_key": "OPENAI_API_KEY"},
    {"id": "anthropic", "name": "Anthropic", "requires_key": True, "env_key": "ANTHROPIC_API_KEY"},
    {"id": "google", "name": "Google GenAI", "requires_key": True, "env_key": "GOOGLE_API_KEY"},
    {"id": "xai", "name": "xAI (Grok)", "requires_key": True, "env_key": "XAI_API_KEY"},
    {"id": "deepseek", "name": "DeepSeek", "requires_key": True, "env_key": "DEEPSEEK_API_KEY"},
    {"id": "openrouter", "name": "OpenRouter", "requires_key": True, "env_key": "OPENROUTER_API_KEY"},
    {"id": "mistral", "name": "Mistral", "requires_key": True, "env_key": "MISTRAL_API_KEY"},
    {"id": "groq", "name": "Groq", "requires_key": True, "env_key": "GROQ_API_KEY"},
    {"id": "nvidia", "name": "NVIDIA", "requires_key": True, "env_key": "NVIDIA_API_KEY"},
    {"id": "ollama", "name": "Ollama (Local)", "requires_key": False, "env_key": None},
    {"id": "bedrock", "name": "AWS Bedrock", "requires_key": False, "env_key": "AWS_BEARER_TOKEN_BEDROCK"},
    {"id": "openai_compatible", "name": "OpenAI Compatible", "requires_key": False, "env_key": "OPENAI_COMPATIBLE_API_KEY"},
]

MODELS: dict[str, dict[str, list[str]]] = {
    "openai": {
        "quick": ["gpt-5.4-mini", "gpt-5.4-nano", "gpt-5.5"],
        "deep": ["gpt-5.5", "gpt-5.4", "gpt-5.2", "gpt-5.5-pro"],
    },
    "anthropic": {
        "quick": ["claude-sonnet-5", "claude-haiku-4-5"],
        "deep": ["claude-fable-5", "claude-opus-4-8", "claude-sonnet-5", "claude-opus-4-7"],
    },
    "google": {
        "quick": ["gemini-3.5-flash", "gemini-3.1-flash-lite"],
        "deep": ["gemini-3.1-pro-preview", "gemini-3.5-flash"],
    },
    "xai": {
        "quick": ["grok-4.3", "grok-4.20-0309-non-reasoning"],
        "deep": ["grok-4.3", "grok-4.20-0309-reasoning"],
    },
    "deepseek": {
        "quick": ["deepseek-v4-flash"],
        "deep": ["deepseek-v4-pro", "deepseek-v4-flash"],
    },
    "nvidia": {
        "quick": ["nvidia/nemotron-3-nano-30b-a3b", "nvidia/nemotron-3-mini-8b-a3b"],
        "deep": ["nvidia/nemotron-3-ultra-550b-a55b", "nvidia/nemotron-3-super-49b-a49b"],
    },
    "ollama": {
        "quick": ["qwen3:latest", "gpt-oss:latest", "glm-4.7-flash:latest"],
        "deep": ["qwen3:latest", "gpt-oss:latest", "glm-4.7-flash:latest"],
    },
}

DATA_VENDORS = {
    "core_stock_apis": ["yfinance", "alpha_vantage"],
    "technical_indicators": ["yfinance", "alpha_vantage"],
    "fundamental_data": ["yfinance", "alpha_vantage"],
    "news_data": ["yfinance", "alpha_vantage"],
    "macro_data": ["fred"],
    "prediction_markets": ["polymarket"],
}


@router.get("/providers")
async def get_providers():
    return PROVIDERS


@router.get("/models")
async def get_models(provider: str | None = None):
    if provider and provider in MODELS:
        return {provider: MODELS[provider]}
    return MODELS


@router.get("/data_vendors")
async def get_data_vendors():
    return DATA_VENDORS
