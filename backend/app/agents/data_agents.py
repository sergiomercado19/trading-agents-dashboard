from __future__ import annotations
from typing import Any
from app.agents.base import BaseAgent


class MarketAnalyst(BaseAgent):
    name = "market_analyst"
    phase = "data_analysis"

    def build_system(self) -> str:
        return (
            "You are a Senior Market Analyst specializing in technical analysis, "
            "price action, and market microstructure. Analyze the provided market data "
            "and produce a concise technical report with key support/resistance levels, "
            "trend direction, and technical indicators."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        web_data = context.get("market_analyst_web_data", "")
        return (
            f"Analyze the market technicals for {ticker}.\n\n"
            f"Date: {context.get('date', 'N/A')}\n\n"
            + (f"Recent market data from the web:\n{web_data}\n\n" if web_data else "")
            + "Provide:\n"
            "1. Current trend direction (bullish/bearish/sideways)\n"
            "2. Key support and resistance levels\n"
            "3. Technical indicator summary (RSI, MACD, moving averages)\n"
            "4. Volume analysis\n"
            "5. Short-term price outlook (1-5 days)\n\n"
            "Be specific with numbers and levels."
        )


class NewsAnalyst(BaseAgent):
    name = "news_analyst"
    phase = "data_analysis"

    def build_system(self) -> str:
        return (
            "You are a Senior Financial News Analyst. Analyze recent news and catalysts "
            "for the given stock. Identify material events, earnings, regulatory changes, "
            "and market sentiment shifts. Assess impact on stock price."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        web_data = context.get("news_analyst_web_data", "")
        recent_news = context.get("recent_news", "")
        data_section = web_data or recent_news or "No recent news data available."
        return (
            f"Analyze recent news for {ticker}.\n\n"
            f"Recent news:\n{data_section}\n\n"
            "Provide:\n"
            "1. Key news catalysts (positive and negative)\n"
            "2. Sentiment assessment (bullish/bearish/neutral)\n"
            "3. Impact score (1-10)\n"
            "4. Expected short-term price catalysts\n"
            "5. Risk factors from news"
        )


class SocialAnalyst(BaseAgent):
    name = "social_analyst"
    phase = "data_analysis"

    def build_system(self) -> str:
        return (
            "You are a Social Sentiment Analyst specializing in social media analysis, "
            "Reddit sentiment, Twitter/X trends, and retail investor mood. Analyze the "
            "social media signals for the given stock."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        web_data = context.get("social_analyst_web_data", "")
        social_data = context.get("social_data", "")
        data_section = web_data or social_data or "No social media data available."
        return (
            f"Analyze social media sentiment for {ticker}.\n\n"
            f"Social data:\n{data_section}\n\n"
            "Provide:\n"
            "1. Overall sentiment (bullish/bearish/neutral)\n"
            "2. Sentiment score (-100 to +100)\n"
            "3. Key topics/discussions\n"
            "4. Notable influencers or high-engagement posts\n"
            "5. Sentiment trend (improving/stable/declining)"
        )


class FundamentalsAnalyst(BaseAgent):
    name = "fundamentals_analyst"
    phase = "data_analysis"

    def build_system(self) -> str:
        return (
            "You are a Senior Fundamental Analyst. Analyze financial statements, "
            "valuation metrics, and business fundamentals. Provide a thorough "
            "assessment of intrinsic value and financial health."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        web_data = context.get("fundamentals_analyst_web_data", "")
        fundamentals = context.get("fundamentals", "")
        data_section = web_data or fundamentals or "No fundamental data available."
        return (
            f"Analyze fundamentals for {ticker}.\n\n"
            f"Fundamental data:\n{data_section}\n\n"
            "Provide:\n"
            "1. Valuation assessment (P/E, P/S, PEG vs peers)\n"
            "2. Financial health (debt, cash flow, margins)\n"
            "3. Growth trajectory (revenue, earnings)\n"
            "4. Competitive position\n"
            "5. Intrinsic value estimate vs current price"
        )


class MacroAnalyst(BaseAgent):
    name = "macro_analyst"
    phase = "data_analysis"

    def build_system(self) -> str:
        return (
            "You are a Macro Economic Analyst. Analyze macro-economic conditions "
            "including interest rates, inflation, GDP growth, sector trends, and "
            "geopolitical factors that could impact the given stock."
        )

    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        web_data = context.get("macro_analyst_web_data", "")
        macro = context.get("macro_data", "")
        data_section = web_data or macro or "No macro data available."
        return (
            f"Analyze macro-economic conditions for {ticker}.\n\n"
            f"Macro data:\n{data_section}\n\n"
            "Provide:\n"
            "1. Interest rate environment impact\n"
            "2. Sector-specific macro trends\n"
            "3. Geopolitical risk factors\n"
            "4. Currency and commodity impacts\n"
            "5. Overall macro environment assessment"
        )
