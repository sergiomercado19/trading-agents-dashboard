from __future__ import annotations

from backend.app.models.schemas import AnalyzeRequest


# Approximate token prices per 1M tokens (USD)
PRICING_TABLE: dict[str, dict[str, float]] = {
    "openai": {
        "gpt-5.4-mini": {"input": 0.15, "output": 0.60},
        "gpt-5.4-nano": {"input": 0.08, "output": 0.30},
        "gpt-5.4": {"input": 2.50, "output": 10.00},
        "gpt-5.5": {"input": 2.50, "output": 10.00},
        "gpt-5.5-pro": {"input": 10.00, "output": 40.00},
        "gpt-5.2": {"input": 1.25, "output": 5.00},
    },
    "anthropic": {
        "claude-sonnet-5": {"input": 3.00, "output": 15.00},
        "claude-haiku-4-5": {"input": 0.80, "output": 4.00},
        "claude-fable-5": {"input": 15.00, "output": 75.00},
        "claude-opus-4-8": {"input": 15.00, "output": 75.00},
        "claude-opus-4-7": {"input": 15.00, "output": 75.00},
    },
    "google": {
        "gemini-3.5-flash": {"input": 0.075, "output": 0.30},
        "gemini-3.1-flash-lite": {"input": 0.0375, "output": 0.15},
        "gemini-3.1-pro-preview": {"input": 1.25, "output": 10.00},
    },
    "xai": {
        "grok-4.3": {"input": 3.00, "output": 15.00},
        "grok-4.20-0309-non-reasoning": {"input": 3.00, "output": 15.00},
        "grok-4.20-0309-reasoning": {"input": 3.00, "output": 15.00},
    },
    "deepseek": {
        "deepseek-v4-flash": {"input": 0.14, "output": 0.28},
        "deepseek-v4-pro": {"input": 0.55, "output": 2.19},
    },
    "ollama": {
        "qwen3:latest": {"input": 0.0, "output": 0.0},
        "gpt-oss:latest": {"input": 0.0, "output": 0.0},
        "glm-4.7-flash:latest": {"input": 0.0, "output": 0.0},
    },
}

# Rough token estimates per analysis stage (tokens)
STAGE_TOKEN_ESTIMATES = {
    "market_analyst": {"input": 3000, "output": 2000},
    "social_media_analyst": {"input": 4000, "output": 2000},
    "news_analyst": {"input": 5000, "output": 2500},
    "fundamentals_analyst": {"input": 6000, "output": 3000},
    "bull_researcher": {"input": 4000, "output": 2000},
    "bear_researcher": {"input": 4000, "output": 2000},
    "research_manager": {"input": 5000, "output": 2000},
    "portfolio_manager": {"input": 5000, "output": 1500},
    "trader": {"input": 3000, "output": 1000},
    "risk_debate": {"input": 6000, "output": 3000},
}


class CostEstimator:
    """Token pricing table + pre-run cost estimation."""

    def get_pricing(self, provider: str | None = None) -> dict:
        if provider:
            return {provider: PRICING_TABLE.get(provider, {})}
        return PRICING_TABLE

    def estimate_cost(
        self,
        request: AnalyzeRequest,
    ) -> dict:
        provider = request.provider
        quick_model = request.quick_model
        deep_model = request.deep_model

        pricing = PRICING_TABLE.get(provider, {})
        quick_price = pricing.get(quick_model, {"input": 1.0, "output": 3.0})
        deep_price = pricing.get(deep_model, {"input": 2.5, "output": 10.0})

        # Estimate based on selected analysts
        selected_stages = []
        analyst_map = {
            "market": ["market_analyst"],
            "social": ["social_media_analyst"],
            "news": ["news_analyst"],
            "fundamentals": ["fundamentals_analyst"],
        }
        for a in request.analysts:
            selected_stages.extend(analyst_map.get(a, []))

        # Research stages always run
        selected_stages.extend(["bull_researcher", "bear_researcher", "research_manager"])
        # Risk debate rounds
        depth = request.research_depth
        risk_rounds = max(1, depth // 2)
        for _ in range(risk_rounds):
            selected_stages.append("risk_debate")
        selected_stages.extend(["portfolio_manager", "trader"])

        total_input = 0
        total_output = 0
        for stage in selected_stages:
            est = STAGE_TOKEN_ESTIMATES.get(stage, {"input": 3000, "output": 1500})
            total_input += est["input"]
            total_output += est["output"]

        # Deep thinker used for research + debate (roughly 40% of stages)
        deep_pct = 0.4
        quick_pct = 1.0 - deep_pct

        cost_input = (
            total_input * deep_pct * deep_price["input"] / 1_000_000
            + total_input * quick_pct * quick_price["input"] / 1_000_000
        )
        cost_output = (
            total_output * deep_pct * deep_price["output"] / 1_000_000
            + total_output * quick_pct * quick_price["output"] / 1_000_000
        )
        total_cost = cost_input + cost_output

        return {
            "estimated_tokens_in": total_input,
            "estimated_tokens_out": total_output,
            "estimated_cost_usd": round(total_cost, 4),
            "stages": selected_stages,
            "quick_model_price": quick_price,
            "deep_model_price": deep_price,
            "provider": provider,
        }


cost_estimator = CostEstimator()
