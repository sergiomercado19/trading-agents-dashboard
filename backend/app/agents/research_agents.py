from __future__ import annotations
from typing import Any
from app.agents.base import BaseAgent


class BullResearcher(BaseAgent):
    name = "bull_researcher"
    phase = "research"

    def build_system(self) -> str:
        return (
            "You are a Bull Researcher. Your job is to construct the strongest possible "
            "bullish case for the stock. Focus on growth catalysts, competitive advantages, "
            "undervaluation signals, and positive momentum. Be persuasive but factual."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        reports = context.get("data_reports", "No analyst reports available.")
        debate = context.get("debate_history", "")
        return (
            f"Construct a bullish case for {ticker}.\n\n"
            f"Analyst Reports:\n{reports}\n\n"
            f"{'Previous debate rounds:\n' + debate if debate else ''}\n\n"
            "Provide:\n"
            "1. Top 3 bull thesis points with evidence\n"
            "2. Growth catalysts and catalysts timeline\n"
            "3. Valuation upside scenario\n"
            "4. Key risk mitigation arguments\n"
            "5. Confidence level (1-10) and reasoning"
        )


class BearResearcher(BaseAgent):
    name = "bear_researcher"
    phase = "research"

    def build_system(self) -> str:
        return (
            "You are a Bear Researcher. Your job is to construct the strongest possible "
            "bearish case for the stock. Focus on risks, overvaluation, competitive threats, "
            "and negative momentum. Be critical but factual."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        reports = context.get("data_reports", "No analyst reports available.")
        debate = context.get("debate_history", "")
        return (
            f"Construct a bearish case for {ticker}.\n\n"
            f"Analyst Reports:\n{reports}\n\n"
            f"{'Previous debate rounds:\n' + debate if debate else ''}\n\n"
            "Provide:\n"
            "1. Top 3 bear thesis points with evidence\n"
            "2. Key risks and threats\n"
            "3. Downside valuation scenario\n"
            "4. Counter-arguments to bull thesis\n"
            "5. Confidence level (1-10) and reasoning"
        )
