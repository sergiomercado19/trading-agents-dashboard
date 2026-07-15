from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, Query
from pydantic import BaseModel

from backend.app.models.schemas import TickerSuggestion
from backend.app.services.tickers_store import tickers_store

router = APIRouter(prefix="/api", tags=["ticker"])

logger = logging.getLogger(__name__)

# KRX suffix map: Korean tickers use .KS (KOSPI) or .KQ (KDAQ)
_KRX_MAP: dict[str, str] = {}


def _to_yahoo_symbol(query: str) -> str:
    """Convert KRX-style tickers (e.g. '005930') to Yahoo format ('005930.KS')."""
    q = query.strip().upper()
    if q.isdigit() and len(q) == 6:
        return f"{q}.KS"
    return q


@router.get("/ticker/search")
async def search_ticker(q: str = Query(..., min_length=1)):
    symbol = _to_yahoo_symbol(q)
    suggestions: list[TickerSuggestion] = []

    try:
        url = f"https://query1.finance.yahoo.com/v1/finance/search?q={symbol}&quotesCount=10&newsCount=0"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers={"User-Agent": "TradingAgents/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                for quote in data.get("quotes", []):
                    suggestions.append(TickerSuggestion(
                        symbol=quote.get("symbol", ""),
                        name=quote.get("shortname") or quote.get("longname", ""),
                        exchange=quote.get("exchange", ""),
                        type=quote.get("quoteType", ""),
                    ))
    except Exception as e:
        logger.warning("Ticker search failed: %s", e)

    # If we converted to .KS but got no results, try the original
    if not suggestions and symbol != q.strip().upper():
        try:
            url = f"https://query1.finance.yahoo.com/v1/finance/search?q={q.strip().upper()}&quotesCount=10&newsCount=0"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, headers={"User-Agent": "TradingAgents/1.0"})
                if resp.status_code == 200:
                    data = resp.json()
                    for quote in data.get("quotes", []):
                        suggestions.append(TickerSuggestion(
                            symbol=quote.get("symbol", ""),
                            name=quote.get("shortname") or quote.get("longname", ""),
                            exchange=quote.get("exchange", ""),
                            type=quote.get("quoteType", ""),
                        ))
        except Exception:
            pass

    return suggestions


class UpdateTickerNamesRequest(BaseModel):
    names: dict[str, str | None]


@router.get("/ticker/names")
async def get_ticker_names():
    return tickers_store.list()


@router.put("/ticker/names")
async def update_ticker_names(req: UpdateTickerNamesRequest):
    return tickers_store.update(req.names)
