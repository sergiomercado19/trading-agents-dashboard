from __future__ import annotations

import re
from typing import Literal


class DebateExtractor:
    """Parse raw execution logs into a structured Bull/Bear/Risk/Neutral transcript."""

    AGENT_MARKERS = {
        "bull": ["bull_researcher", "bull_case", "bull_argument"],
        "bear": ["bear_researcher", "bear_case", "bear_argument"],
        "risk": ["risk_mgmt", "risk_debate", "conservative_debator", "neutral_debator", "aggressive_debator"],
        "neutral": ["research_manager", "portfolio_manager", "final_decision"],
    }

    def extract(self, logs: str | list[dict]) -> dict[str, list[dict]]:
        if isinstance(logs, str):
            lines = logs.split("\n")
        else:
            lines = [entry.get("content", "") for entry in logs if isinstance(entry, dict)]

        transcript: dict[str, list[dict]] = {
            "bull": [],
            "bear": [],
            "risk": [],
            "neutral": [],
        }

        current_speaker: Literal["bull", "bear", "risk", "neutral"] | None = None
        current_text: list[str] = []

        for line in lines:
            detected = self._detect_speaker(line)
            if detected and detected != current_speaker:
                if current_speaker and current_text:
                    transcript[current_speaker].append({
                        "speaker": current_speaker,
                        "text": "\n".join(current_text).strip(),
                    })
                current_speaker = detected
                current_text = [line]
            elif current_speaker:
                current_text.append(line)

        if current_speaker and current_text:
            transcript[current_speaker].append({
                "speaker": current_speaker,
                "text": "\n".join(current_text).strip(),
            })

        return transcript

    def _detect_speaker(self, line: str) -> Literal["bull", "bear", "risk", "neutral"] | None:
        lower = line.lower()
        for speaker, markers in self.AGENT_MARKERS.items():
            for marker in markers:
                if marker in lower:
                    return speaker  # type: ignore[return-value]
        return None


debate_extractor = DebateExtractor()
