from __future__ import annotations
from typing import Any
from app.agents.base import BaseAgent


class TraderAgent(BaseAgent):
    name = "trader"
    phase = "trading"

    def build_system(self) -> str:
        return (
            "You are a Senior Trader. Based on the research and debate outcomes, "
            "develop a concrete trading strategy. Include entry/exit points, position "
            "sizing rationale, and trade execution plan."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        research = context.get("research_output", "No research available.")
        return (
            f"Develop a trading plan for {ticker}.\n\n"
            f"Research:\n{research}\n\n"
            "Provide:\n"
            "1. Trade recommendation (BUY/SELL/HOLD)\n"
            "2. Entry price range\n"
            "3. Stop loss level\n"
            "4. Target price(s)\n"
            "5. Position sizing recommendation (% of portfolio)\n"
            "6. Time horizon\n"
            "7. Risk/reward ratio"
        )


class RiskyAnalyst(BaseAgent):
    name = "risky_analyst"
    phase = "risk"

    def build_system(self) -> str:
        return (
            "You are an Aggressive Risk Analyst. You tend to take larger risks for "
            "higher returns. Analyze the trading plan from an aggressive perspective, "
            "highlighting opportunities that conservative analysts might miss."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        trading_plan = context.get("trading_plan", "No trading plan available.")
        return (
            f"Aggressive risk assessment for {ticker}.\n\n"
            f"Trading Plan:\n{trading_plan}\n\n"
            "Provide:\n"
            "1. Aggressive position sizing recommendation\n"
            "2. Leverage considerations\n"
            "3. Upside opportunity assessment\n"
            "4. Maximum acceptable risk\n"
            "5. Risk score (1-10, higher = more risk)"
        )


class SafeAnalyst(BaseAgent):
    name = "safe_analyst"
    phase = "risk"

    def build_system(self) -> str:
        return (
            "You are a Conservative Risk Analyst. You prioritize capital preservation "
            "and downside protection. Analyze the trading plan from a defensive perspective, "
            "emphasizing risk mitigation."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        trading_plan = context.get("trading_plan", "No trading plan available.")
        return (
            f"Conservative risk assessment for {ticker}.\n\n"
            f"Trading Plan:\n{trading_plan}\n\n"
            "Provide:\n"
            "1. Conservative position sizing recommendation\n"
            "2. Maximum drawdown tolerance\n"
            "3. Hedging suggestions\n"
            "4. Exit criteria (when to cut losses)\n"
            "5. Risk score (1-10, higher = more risk)"
        )


class NeutralAnalyst(BaseAgent):
    name = "neutral_analyst"
    phase = "risk"

    def build_system(self) -> str:
        return (
            "You are a Neutral Risk Analyst. You provide balanced, objective risk "
            "assessment. Consider both aggressive and conservative perspectives to "
            "arrive at a moderate recommendation."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        trading_plan = context.get("trading_plan", "No trading plan available.")
        return (
            f"Balanced risk assessment for {ticker}.\n\n"
            f"Trading Plan:\n{trading_plan}\n\n"
            "Provide:\n"
            "1. Balanced position sizing recommendation\n"
            "2. Risk tolerance range\n"
            "3. Key risk factors to monitor\n"
            "4. Recommended risk management strategy\n"
            "5. Risk score (1-10, higher = more risk)"
        )


class RiskManager(BaseAgent):
    name = "risk_manager"
    phase = "risk"

    def build_system(self) -> str:
        return (
            "You are the Risk Manager. You synthesize the perspectives of the risky, "
            "safe, and neutral analysts into a final risk assessment. You make the "
            "ultimate decision on position sizing and risk parameters."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        risk_reports = context.get("risk_reports", "No risk reports available.")
        return (
            f"Final risk assessment for {ticker}.\n\n"
            f"Risk Analyst Reports:\n{risk_reports}\n\n"
            "Provide:\n"
            "1. Final position sizing recommendation\n"
            "2. Maximum risk exposure\n"
            "3. Stop loss level\n"
            "4. Risk management rules\n"
            "5. Overall risk rating (LOW/MEDIUM/HIGH)\n"
            "6. Rationale for final decision"
        )
