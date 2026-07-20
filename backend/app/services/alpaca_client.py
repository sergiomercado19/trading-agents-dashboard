from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

ALPACA_PAPER_BASE = "https://paper-api.alpaca.markets"
ALPACA_DATA_BASE = "https://data.alpaca.markets"


class AlpacaClientError(Exception):
    pass


class AlpacaClient:
    def __init__(self, api_key: str, api_secret: str, base_url: str = ALPACA_PAPER_BASE):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = base_url.rstrip("/")
        self.data_url = ALPACA_DATA_BASE
        self._headers = {
            "APCA-API-KEY-ID": api_key,
            "APCA-API-SECRET-KEY": api_secret,
        }

    async def _request(self, method: str, url: str, **kwargs) -> dict[str, Any] | list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.request(method, url, headers=self._headers, **kwargs)
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                detail = e.response.text[:500]
                logger.warning("Alpaca API %s %s returned %d: %s", method, url, e.response.status_code, detail)
                raise AlpacaClientError(f"Alpaca API error ({e.response.status_code}): {detail}") from e
            except httpx.RequestError as e:
                logger.warning("Alpaca API request failed: %s", e)
                raise AlpacaClientError(f"Alpaca connection error: {e}") from e

    async def test_connection(self) -> bool:
        try:
            await self._request("GET", f"{self.base_url}/v2/account")
            return True
        except AlpacaClientError:
            return False

    async def get_account(self) -> dict[str, Any]:
        data = await self._request("GET", f"{self.base_url}/v2/account")
        equity = float(data.get("equity", 0))
        buying_power = float(data.get("buying_power", 0))
        last_equity = float(data.get("last_equity", equity))
        return {
            "equity": equity,
            "buying_power": buying_power,
            "portfolio_value": float(data.get("portfolio_value", equity)),
            "day_pnl": equity - last_equity,
            "status": data.get("status", "unknown"),
            "currency": data.get("currency", "USD"),
            "trading_blocked": data.get("trading_blocked", False),
            "account_blocked": data.get("account_blocked", False),
        }

    async def get_positions(self) -> list[dict[str, Any]]:
        data = await self._request("GET", f"{self.base_url}/v2/positions")
        positions = []
        for p in data:
            positions.append({
                "symbol": p.get("symbol", ""),
                "qty": float(p.get("qty", 0)),
                "avg_entry_price": float(p.get("avg_entry_price", 0)),
                "current_price": float(p.get("current_price", 0)),
                "market_value": float(p.get("market_value", 0)),
                "unrealized_pl": float(p.get("unrealized_pl", 0)),
                "unrealized_plpc": float(p.get("unrealized_plpc", 0)),
                "side": p.get("side", "long"),
                "asset_class": p.get("asset_class", "us_equity"),
            })
        return positions

    async def submit_order(
        self,
        symbol: str,
        qty: int,
        side: str,
        order_type: str = "market",
        limit_price: float | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "symbol": symbol.upper(),
            "qty": str(qty),
            "side": side,
            "type": order_type,
            "time_in_force": "day",
        }
        if order_type == "limit" and limit_price is not None:
            body["limit_price"] = str(limit_price)

        data = await self._request("POST", f"{self.base_url}/v2/orders", json=body)
        return {
            "order_id": data.get("id", ""),
            "symbol": data.get("symbol", ""),
            "side": data.get("side", ""),
            "qty": data.get("qty", ""),
            "type": data.get("type", ""),
            "status": data.get("status", ""),
            "filled_avg_price": data.get("filled_avg_price"),
            "submitted_at": data.get("submitted_at", ""),
        }

    async def close_position(self, symbol: str) -> dict[str, Any]:
        data = await self._request("DELETE", f"{self.base_url}/v2/positions/{symbol.upper()}")
        return {
            "symbol": data.get("symbol", ""),
            "qty": data.get("qty", ""),
            "status": "closed",
        }
