from fastapi import APIRouter

router = APIRouter(tags=["providers"])

PROVIDERS = {
    "anthropic": {
        "name": "Anthropic",
        "models": [
            {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus"},
            {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku"},
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet"},
            {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4"},
        ],
    },
    "google": {
        "name": "Google Gemini",
        "models": [
            {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash"},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro"},
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
            {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
        ],
    },
    "nvidia": {
        "name": "NVIDIA NIM",
        "models": [
            {"id": "meta/llama-3.1-70b-instruct", "name": "Llama 3.1 70B Instruct"},
            {"id": "meta/llama-3.1-405b-instruct", "name": "Llama 3.1 405B Instruct"},
            {"id": "nvidia/nemotron-3-nano-30b-a3b", "name": "Nemotron 3 Nano 30B"},
            {"id": "nvidia/nemotron-3-ultra-550b-a55b", "name": "Nemotron 3 Ultra 550B"},
        ],
    },
    "openai": {
        "name": "OpenAI",
        "models": [
            {"id": "gpt-4.1", "name": "GPT-4.1"},
            {"id": "gpt-4.1-mini", "name": "GPT-4.1 Mini"},
            {"id": "gpt-4o", "name": "GPT-4o"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini"},
            {"id": "o3", "name": "o3"},
            {"id": "o3-mini", "name": "o3-mini"},
            {"id": "o4-mini", "name": "o4-mini"},
        ],
    },
    "openrouter": {
        "name": "OpenRouter",
        "models": [
            {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet (via OpenRouter)"},
            {"id": "anthropic/claude-sonnet-4", "name": "Claude Sonnet 4 (via OpenRouter)"},
            {"id": "google/gemini-2.5-pro", "name": "Gemini 2.5 Pro (via OpenRouter)"},
            {"id": "meta-llama/llama-4-maverick", "name": "Llama 4 Maverick (via OpenRouter)"},
            {"id": "openai/gpt-4o", "name": "GPT-4o (via OpenRouter)"},
            {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini (via OpenRouter)"},
        ],
    },
}


@router.get("/providers")
async def list_providers():
    return PROVIDERS
