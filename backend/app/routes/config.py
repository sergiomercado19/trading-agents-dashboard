from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["config"])


@router.get("/analysts")
async def get_analysts():
    return [
        {"id": "market", "name": "Market Analyst", "description": "Technical analysis, charts, indicators"},
        {"id": "social", "name": "Social Media Analyst", "description": "Reddit, StockTwits sentiment"},
        {"id": "news", "name": "News Analyst", "description": "Recent news, press releases, filings"},
        {"id": "fundamentals", "name": "Fundamentals Analyst", "description": "Financials, ratios, valuation"},
    ]


@router.get("/teams")
async def get_teams():
    return [
        {"id": "research", "name": "Research Team", "agents": ["bull_researcher", "bear_researcher"]},
        {"id": "management", "name": "Management Team", "agents": ["research_manager", "portfolio_manager", "trader"]},
        {"id": "risk", "name": "Risk Team", "agents": ["aggressive_debator", "neutral_debator", "conservative_debator"]},
    ]


@router.get("/section_titles")
async def get_section_titles():
    return {
        "market": "Market Analysis",
        "social": "Social Sentiment",
        "news": "News Analysis",
        "fundamentals": "Fundamental Analysis",
        "bull": "Bull Case",
        "bear": "Bear Case",
        "risk": "Risk Assessment",
        "final": "Final Recommendation",
    }
