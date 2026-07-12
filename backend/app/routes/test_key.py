from __future__ import annotations

import logging
import subprocess
import sys

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["test_key"])

logger = logging.getLogger(__name__)

# Map provider -> the env var that holds its API key
PROVIDER_KEY_MAP = {
    "openai": "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "google": "GOOGLE_API_KEY",
    "xai": "XAI_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "mistral": "MISTRAL_API_KEY",
    "groq": "GROQ_API_KEY",
    "nvidia": "NVIDIA_API_KEY",
    "bedrock": "AWS_BEARER_TOKEN_BEDROCK",
    "openai_compatible": "OPENAI_COMPATIBLE_API_KEY",
    "fred": "FRED_API_KEY",
}


@router.post("/test_key")
async def test_key(data: dict):
    provider = data.get("provider", "")
    key = data.get("key", "")
    env_key = data.get("env_key", "")

    if not key and not env_key:
        return {"valid": False, "message": "No key provided"}

    # For OpenAI, do a lightweight API call
    if provider == "openai" and key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {key}"},
                )
                if resp.status_code == 200:
                    return {"valid": True, "message": "Key is valid"}
                elif resp.status_code == 401:
                    return {"valid": False, "message": "Invalid API key"}
                else:
                    return {"valid": False, "message": f"API returned {resp.status_code}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection failed: {str(e)[:100]}"}

    # For Anthropic
    if provider == "anthropic" and key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers={
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                    },
                )
                if resp.status_code == 200:
                    return {"valid": True, "message": "Key is valid"}
                elif resp.status_code == 401:
                    return {"valid": False, "message": "Invalid API key"}
                else:
                    return {"valid": False, "message": f"API returned {resp.status_code}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection failed: {str(e)[:100]}"}

    # For Google
    if provider == "google" and key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={key}",
                )
                if resp.status_code == 200:
                    return {"valid": True, "message": "Key is valid"}
                elif resp.status_code in (400, 403):
                    return {"valid": False, "message": "Invalid API key"}
                else:
                    return {"valid": False, "message": f"API returned {resp.status_code}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection failed: {str(e)[:100]}"}

    # For FRED
    if provider == "fred" and key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://api.stlouisfed.org/fred/series?series_id=GDP&api_key={key}&file_type=json",
                )
                if resp.status_code == 200:
                    return {"valid": True, "message": "Key is valid"}
                else:
                    return {"valid": False, "message": f"API returned {resp.status_code}"}
        except Exception as e:
            return {"valid": False, "message": f"Connection failed: {str(e)[:100]}"}

    # For Ollama — just check if the server is reachable
    if provider == "ollama":
        try:
            import httpx
            base_url = key or "http://localhost:11434"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{base_url}/api/tags")
                if resp.status_code == 200:
                    return {"valid": True, "message": "Ollama server reachable"}
                else:
                    return {"valid": False, "message": f"Ollama returned {resp.status_code}"}
        except Exception as e:
            return {"valid": False, "message": f"Cannot reach Ollama: {str(e)[:100]}"}

    # Generic: just check if key is non-empty
    if key:
        return {"valid": True, "message": "Key saved (validation not available for this provider)"}

    return {"valid": False, "message": "No key provided"}
