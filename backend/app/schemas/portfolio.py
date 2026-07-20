from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class TradeRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    qty: int = Field(..., gt=0)
    side: Literal["buy", "sell"]
    type: Literal["market", "limit"] = "market"
    limit_price: Optional[float] = None


class AlpacaConfigRequest(BaseModel):
    api_key: str = Field(..., min_length=1)
    api_secret: str = Field(..., min_length=1)
    paper_trading: bool = True


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class PositionResponse(BaseModel):
    symbol: str
    qty: float
    avg_entry_price: float
    current_price: float
    market_value: float
    unrealized_pl: float
    unrealized_plpc: float
    side: str


class AccountResponse(BaseModel):
    equity: float
    buying_power: float
    day_pnl: float
    portfolio_value: float
    status: str


class TradeResponse(BaseModel):
    order_id: str
    symbol: str
    side: str
    qty: str
    type: str
    status: str
    filled_avg_price: Optional[str] = None
    submitted_at: str = ""


class AlpacaConfigResponse(BaseModel):
    is_connected: bool
    paper_trading: bool
    last_sync: Optional[str] = None


# ---------------------------------------------------------------------------
# Trade History
# ---------------------------------------------------------------------------

class TradeHistoryItem(BaseModel):
    id: int
    ticker: str
    side: str
    quantity: float
    price: float
    order_type: str
    status: str
    filled_at: Optional[str] = None
    filled_price: Optional[float] = None
    filled_quantity: Optional[float] = None
    commission: float = 0.0
    notes: Optional[str] = None
    created_at: str


class TradeHistoryResponse(BaseModel):
    items: list[TradeHistoryItem]
    total: int
    page: int
    limit: int
    pages: int
