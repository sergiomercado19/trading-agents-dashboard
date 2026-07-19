from __future__ import annotations

import logging
from typing import Any

import yfinance as yf
from fastapi import APIRouter, Query

router = APIRouter(tags=["tickers"])
logger = logging.getLogger(__name__)

# Popular tickers for quick suggestions when query is empty
_POPULAR_TICKERS = [
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corporation"},
    {"symbol": "GOOGL", "name": "Alphabet Inc."},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    {"symbol": "META", "name": "Meta Platforms Inc."},
    {"symbol": "TSLA", "name": "Tesla Inc."},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
    {"symbol": "V", "name": "Visa Inc."},
    {"symbol": "JNJ", "name": "Johnson & Johnson"},
    {"symbol": "WMT", "name": "Walmart Inc."},
    {"symbol": "UNH", "name": "UnitedHealth Group Inc."},
    {"symbol": "MA", "name": "Mastercard Inc."},
    {"symbol": "XOM", "name": "Exxon Mobil Corporation"},
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust"},
    {"symbol": "QQQ", "name": "Invesco QQQ Trust"},
    {"symbol": "AMD", "name": "Advanced Micro Devices Inc."},
    {"symbol": "NFLX", "name": "Netflix Inc."},
    {"symbol": "DIS", "name": "Walt Disney Co."},
    {"symbol": "BA", "name": "Boeing Co."},
]


@router.get("/tickers/search")
async def search_tickers(q: str = Query(default="", description="Ticker symbol or company name")):
    """Search for stock tickers. Returns popular tickers when query is empty."""
    if not q.strip():
        return _POPULAR_TICKERS

    query = q.strip().upper()

    try:
        ticker_obj = yf.Ticker(query)
        info = ticker_obj.info
        if info and info.get("symbol"):
            return [
                {
                    "symbol": info.get("symbol", query),
                    "name": info.get("shortName", info.get("longName", query)),
                }
            ]
    except Exception:
        logger.debug("yfinance lookup failed for %s", query)

    # Fallback: filter popular tickers by prefix match
    return [
        t for t in _POPULAR_TICKERS
        if query in t["symbol"] or query.lower() in t["name"].lower()
    ][:10]
