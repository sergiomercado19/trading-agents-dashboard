from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.data_agents import (
    MarketAnalyst,
    NewsAnalyst,
    SocialAnalyst,
    FundamentalsAnalyst,
    MacroAnalyst,
)
from app.agents.research_agents import BullResearcher, BearResearcher
from app.agents.risk_agents import (
    TraderAgent,
    RiskyAnalyst,
    SafeAnalyst,
    NeutralAnalyst,
    RiskManager,
)
from app.agents.portfolio_agent import PortfolioManager


AGENT_REGISTRY: dict[str, type[BaseAgent]] = {
    "market_analyst": MarketAnalyst,
    "news_analyst": NewsAnalyst,
    "social_analyst": SocialAnalyst,
    "fundamentals_analyst": FundamentalsAnalyst,
    "macro_analyst": MacroAnalyst,
    "bull_researcher": BullResearcher,
    "bear_researcher": BearResearcher,
    "trader": TraderAgent,
    "risky_analyst": RiskyAnalyst,
    "safe_analyst": SafeAnalyst,
    "neutral_analyst": NeutralAnalyst,
    "risk_manager": RiskManager,
    "portfolio_manager": PortfolioManager,
}


PHASE_ORDER = [
    "data_analysis",
    "research",
    "trading",
    "risk",
    "portfolio",
]


PHASE_AGENTS = {
    "data_analysis": ["market_analyst", "news_analyst", "social_analyst", "fundamentals_analyst", "macro_analyst"],
    "research": ["bull_researcher", "bear_researcher"],
    "trading": ["trader"],
    "risk": ["risky_analyst", "safe_analyst", "neutral_analyst", "risk_manager"],
    "portfolio": ["portfolio_manager"],
}


def get_agent(name: str, provider: str = "openai", model: str = "gpt-4o-mini") -> BaseAgent:
    cls = AGENT_REGISTRY.get(name)
    if not cls:
        raise ValueError(f"Unknown agent: {name}")
    return cls(provider=provider, model=model)
