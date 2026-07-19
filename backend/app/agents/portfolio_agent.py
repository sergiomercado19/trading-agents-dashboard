from __future__ import annotations
from typing import Any
from app.agents.base import BaseAgent


class PortfolioManager(BaseAgent):
    name = "portfolio_manager"
    phase = "portfolio"

    def build_system(self) -> str:
        return (
            "You are the Portfolio Manager. You synthesize all analysis, research, "
            "trading, and risk assessments into a final trade decision. You consider "
            "portfolio-level implications and produce the final recommendation."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        research = context.get("research_output", "")
        trading_plan = context.get("trading_plan", "")
        risk_assessment = context.get("risk_assessment", "")

        return (
            f"Final portfolio decision for {ticker}.\n\n"
            f"Research:\n{research}\n\n"
            f"Trading Plan:\n{trading_plan}\n\n"
            f"Risk Assessment:\n{risk_assessment}\n\n"
            "Provide:\n"
            "1. FINAL RECOMMENDATION: BUY / SELL / HOLD\n"
            "2. Confidence score (0-100%)\n"
            "3. Risk score (0-100%)\n"
            "4. Position size (% of portfolio)\n"
            "5. Entry price target\n"
            "6. Stop loss\n"
            "7. Target price\n"
            "8. Time horizon\n"
            "9. Executive summary (2-3 sentences)\n"
            "10. Key factors influencing the decision"
        )
