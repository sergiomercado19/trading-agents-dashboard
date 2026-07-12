from __future__ import annotations

import html
import re
import time
from pathlib import Path

import httpx

from backend.app.models.schemas import FactCheckResult


class FactChecker:
    """URL verification via physical HTTP ping."""

    async def check_url(self, url: str) -> FactCheckResult:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.head(url, headers={"User-Agent": "TradingAgents-FactChecker/1.0"})
                status_code = resp.status_code
                if status_code < 400:
                    status = "valid"
                elif status_code in (401, 403):
                    status = "protected"
                else:
                    status = "broken"
        except httpx.ConnectError:
            status = "broken"
            status_code = None
        except httpx.TimeoutException:
            status = "broken"
            status_code = None
        except Exception:
            status = "unknown"
            status_code = None

        return FactCheckResult(
            url=url,
            status=status,
            status_code=status_code,
            checked_at=time.time(),
        )

    async def check_urls(self, urls: list[str]) -> list[FactCheckResult]:
        results = []
        for url in urls:
            results.append(await self.check_url(url))
        return results

    def extract_urls(self, text: str) -> list[str]:
        url_pattern = re.compile(r'https?://[^\s\)\]\>\"\']+', re.IGNORECASE)
        return list(set(url_pattern.findall(text)))


fact_checker = FactChecker()
