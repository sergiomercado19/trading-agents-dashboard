from __future__ import annotations

import time
import logging
from abc import ABC, abstractmethod
from typing import Any

from app.core.llm import call_llm
from app.schemas.analysis import AgentOutput

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    name: str = "base"
    phase: str = "data_analysis"

    def __init__(self, provider: str = "openai", model: str = "gpt-4o-mini"):
        self.provider = provider
        self.model = model

    @abstractmethod
    def build_prompt(self, ticker: str, context: dict[str, Any]) -> str:
        ...

    @abstractmethod
    def build_system(self) -> str:
        ...

    async def run(self, ticker: str, context: dict[str, Any]) -> AgentOutput:
        prompt = self.build_prompt(ticker, context)
        system = self.build_system()
        start = time.monotonic()

        try:
            content, tokens_in, tokens_out = await call_llm(
                prompt=prompt,
                system=system,
                provider=self.provider,
                model=self.model,
                max_tokens=4000,
                temperature=0.3,
            )
            duration_ms = int((time.monotonic() - start) * 1000)
            return AgentOutput(
                agent_name=self.name,
                phase=self.phase,
                content=content,
                tokens_used=tokens_in + tokens_out,
                cost_usd=0.0,
                duration_ms=duration_ms,
                metadata={"tokens_in": tokens_in, "tokens_out": tokens_out},
            )
        except Exception as e:
            duration_ms = int((time.monotonic() - start) * 1000)
            logger.exception("Agent %s failed", self.name)
            return AgentOutput(
                agent_name=self.name,
                phase=self.phase,
                content="",
                tokens_used=0,
                cost_usd=0.0,
                duration_ms=duration_ms,
                metadata={"error": str(e)},
            )
