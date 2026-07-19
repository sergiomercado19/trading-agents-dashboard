from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, health, analysis, providers, tickers
from app.websockets import routes as ws_routes
from app.websockets.manager import ws_manager
from app.core.config import settings
from app.core.database import init_db, close_db

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
    
    try:
        await ws_manager.start_heartbeat()
        logger.info("WebSocket heartbeat started")
    except Exception as e:
        logger.warning(f"WebSocket heartbeat failed to start: {e}")
    
    yield
    
    logger.info("Shutting down...")
    try:
        await ws_manager.stop_heartbeat()
    except Exception:
        pass
    try:
        await close_db()
    except Exception:
        pass


app = FastAPI(
    title="TradingAgents Dashboard",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(providers.router, prefix="/api", tags=["providers"])
app.include_router(tickers.router, prefix="/api", tags=["tickers"])

# WebSocket routes
app.include_router(ws_routes.router, tags=["websocket"])


@app.get("/api")
async def root():
    return {
        "name": "TradingAgents Dashboard",
        "version": "0.1.0",
        "docs": "/api/docs",
    }