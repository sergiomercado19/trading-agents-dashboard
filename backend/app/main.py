from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.routes import health, stream, runs, config, env, analyze, ticker, estimate, providers, reports, scheduler


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.app.services.scheduler import scheduler as sched
    try:
        sched.start()
        logger.info("Scheduler started")
    except Exception as e:
        logger.warning("Scheduler failed to start: %s", e)
    yield
    try:
        sched.shutdown()
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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(stream.router)
app.include_router(runs.router)
app.include_router(config.router)
app.include_router(env.router)
app.include_router(analyze.router)
app.include_router(ticker.router)
app.include_router(estimate.router)
app.include_router(providers.router)
app.include_router(reports.router)
app.include_router(scheduler.router)


@app.get("/api")
async def root():
    return {
        "name": "TradingAgents Dashboard",
        "version": "0.1.0",
        "docs": "/api/docs",
    }
