from __future__ import annotations

import subprocess
import sys
from importlib import import_module
from pathlib import Path

from fastapi import APIRouter

from backend.app.models.schemas import DetailedHealthResponse, HealthResponse, InstallResponse

router = APIRouter(prefix="/api", tags=["health"])

REQUIRED_DEPS = [
    "fastapi",
    "uvicorn",
    "sse_starlette",
    "pydantic",
    "httpx",
]

OPTIONAL_DEPS = {
    "langchain": "langchain-core",
    "langgraph": "langgraph",
    "yfinance": "yfinance",
}


def _check_import(module_name: str) -> bool:
    try:
        import_module(module_name)
        return True
    except ImportError:
        return False


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok")


@router.get("/health/detailed", response_model=DetailedHealthResponse)
async def detailed_health():
    missing = []
    for dep in REQUIRED_DEPS:
        if not _check_import(dep):
            missing.append(dep)

    env_path = (Path(__file__).resolve().parent.parent.parent.parent / ".env").exists()

    return DetailedHealthResponse(
        status="ok" if not missing else "degraded",
        python=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        tradingagents=_check_import("tradingagents"),
        env_file=env_path,
        required_deps=REQUIRED_DEPS,
        missing_deps=missing,
    )


@router.post("/install_missing", response_model=InstallResponse)
async def install_missing():
    installed = []
    errors = []

    for dep in REQUIRED_DEPS:
        if not _check_import(dep):
            try:
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "install", dep],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                if result.returncode == 0:
                    installed.append(dep)
                else:
                    errors.append(f"{dep}: {result.stderr[:200]}")
            except subprocess.TimeoutExpired:
                errors.append(f"{dep}: installation timed out")
            except Exception as e:
                errors.append(f"{dep}: {str(e)[:200]}")

    return InstallResponse(
        success=len(errors) == 0,
        installed=installed,
        errors=errors,
    )
