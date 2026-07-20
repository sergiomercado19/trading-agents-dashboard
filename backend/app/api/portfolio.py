from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models import (
    User, AlpacaConfig, Trade, Position,
    AnalysisStatus,
)
from app.schemas.portfolio import (
    TradeRequest,
    PositionResponse,
    AccountResponse,
    TradeResponse,
    AlpacaConfigRequest,
    AlpacaConfigResponse,
    TradeHistoryItem,
    TradeHistoryResponse,
)
from app.services.alpaca_client import AlpacaClient, AlpacaClientError, ALPACA_PAPER_BASE

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_alpaca_client(user: User, db: AsyncSession) -> AlpacaClient:
    result = await db.execute(
        select(AlpacaConfig).where(AlpacaConfig.user_id == user.id)
    )
    config = result.scalar_one_or_none()
    if not config or not config.api_key_encrypted:
        raise HTTPException(
            status_code=400,
            detail="Alpaca not configured. Please add your API credentials in Settings.",
        )
    # In production, decrypt here. For MVP, keys are stored as-is.
    return AlpacaClient(
        api_key=config.api_key_encrypted,
        api_secret=config.api_secret_encrypted,
        base_url=config.base_url,
    )


# ---------------------------------------------------------------------------
# Portfolio endpoints
# ---------------------------------------------------------------------------

@router.get("/portfolio/positions", response_model=list[PositionResponse])
async def get_positions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = await _get_alpaca_client(current_user, db)

    try:
        alpaca_positions = await client.get_positions()
    except AlpacaClientError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Sync to local DB
    for pos in alpaca_positions:
        result = await db.execute(
            select(Position).where(
                Position.user_id == current_user.id,
                Position.ticker == pos["symbol"],
            )
        )
        db_pos = result.scalar_one_or_none()
        if db_pos:
            db_pos.quantity = pos["qty"]
            db_pos.avg_entry_price = pos["avg_entry_price"]
            db_pos.current_price = pos["current_price"]
            db_pos.market_value = pos["market_value"]
            db_pos.unrealized_pl = pos["unrealized_pl"]
            db_pos.unrealized_plpc = pos["unrealized_plpc"]
            db_pos.side = pos["side"]
            db_pos.updated_at = datetime.now(timezone.utc)
        else:
            db_pos = Position(
                user_id=current_user.id,
                ticker=pos["symbol"],
                quantity=pos["qty"],
                avg_entry_price=pos["avg_entry_price"],
                current_price=pos["current_price"],
                market_value=pos["market_value"],
                unrealized_pl=pos["unrealized_pl"],
                unrealized_plpc=pos["unrealized_plpc"],
                side=pos["side"],
                asset_class=pos.get("asset_class", "us_equity"),
            )
            db.add(db_pos)

    # Remove local positions that no longer exist on Alpaca
    alpaca_symbols = {p["symbol"] for p in alpaca_positions}
    local_result = await db.execute(
        select(Position).where(Position.user_id == current_user.id)
    )
    for local_pos in local_result.scalars().all():
        if local_pos.ticker not in alpaca_symbols:
            await db.delete(local_pos)

    await db.commit()

    return [
        PositionResponse(
            symbol=p["symbol"],
            qty=p["qty"],
            avg_entry_price=p["avg_entry_price"],
            current_price=p["current_price"],
            market_value=p["market_value"],
            unrealized_pl=p["unrealized_pl"],
            unrealized_plpc=p["unrealized_plpc"],
            side=p["side"],
        )
        for p in alpaca_positions
    ]


@router.get("/portfolio/account", response_model=AccountResponse)
async def get_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = await _get_alpaca_client(current_user, db)

    try:
        account = await client.get_account()
    except AlpacaClientError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Update last sync
    result = await db.execute(
        select(AlpacaConfig).where(AlpacaConfig.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if config:
        config.last_sync = datetime.now(timezone.utc)
        await db.commit()

    return AccountResponse(
        equity=account["equity"],
        buying_power=account["buying_power"],
        day_pnl=account["day_pnl"],
        portfolio_value=account["portfolio_value"],
        status=account["status"],
    )


# ---------------------------------------------------------------------------
# Trade execution
# ---------------------------------------------------------------------------

@router.post("/trades", response_model=TradeResponse)
async def submit_trade(
    request: TradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = await _get_alpaca_client(current_user, db)

    try:
        order = await client.submit_order(
            symbol=request.symbol,
            qty=request.qty,
            side=request.side,
            order_type=request.type,
            limit_price=request.limit_price,
        )
    except AlpacaClientError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Save to local DB
    trade = Trade(
        user_id=current_user.id,
        ticker=request.symbol.upper(),
        side=request.side,
        quantity=float(request.qty),
        price=float(order.get("filled_avg_price") or 0),
        order_type=request.type,
        status=order.get("status", "pending"),
        alpaca_order_id=order.get("order_id", ""),
    )
    db.add(trade)
    await db.commit()

    return TradeResponse(
        order_id=order["order_id"],
        symbol=order["symbol"],
        side=order["side"],
        qty=order["qty"],
        type=order["type"],
        status=order["status"],
        filled_avg_price=order.get("filled_avg_price"),
        submitted_at=order.get("submitted_at", ""),
    )


# ---------------------------------------------------------------------------
# Trade history
# ---------------------------------------------------------------------------

@router.get("/trades", response_model=TradeHistoryResponse)
async def list_trades(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    ticker: str | None = Query(None, max_length=20),
    side: str | None = Query(None),
    status: str | None = Query(None),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Trade).where(Trade.user_id == current_user.id)

    if ticker:
        stmt = stmt.where(Trade.ticker.ilike(f"%{ticker}%"))
    if side:
        stmt = stmt.where(Trade.side == side)
    if status:
        stmt = stmt.where(Trade.status == status)
    if from_date:
        from_dt = datetime.fromisoformat(from_date)
        stmt = stmt.where(Trade.created_at >= from_dt)
    if to_date:
        to_dt = datetime.fromisoformat(to_date)
        stmt = stmt.where(Trade.created_at <= to_dt)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one() or 0

    stmt = stmt.order_by(Trade.created_at.desc())
    stmt = stmt.offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    trades = result.scalars().all()

    items = [
        TradeHistoryItem(
            id=t.id,
            ticker=t.ticker,
            side=t.side,
            quantity=t.quantity,
            price=t.price,
            order_type=t.order_type,
            status=t.status,
            filled_at=t.filled_at.isoformat() if t.filled_at else None,
            filled_price=t.filled_price,
            filled_quantity=t.filled_quantity,
            commission=t.commission,
            notes=t.notes,
            created_at=t.created_at.isoformat(),
        )
        for t in trades
    ]

    return TradeHistoryResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )


# ---------------------------------------------------------------------------
# Alpaca config
# ---------------------------------------------------------------------------

@router.get("/portfolio/config", response_model=AlpacaConfigResponse)
async def get_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AlpacaConfig).where(AlpacaConfig.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()

    if not config:
        return AlpacaConfigResponse(
            is_connected=False,
            paper_trading=True,
            last_sync=None,
        )

    return AlpacaConfigResponse(
        is_connected=config.is_connected,
        paper_trading=config.paper_trading,
        last_sync=config.last_sync.isoformat() if config.last_sync else None,
    )


@router.post("/portfolio/config", response_model=AlpacaConfigResponse)
async def save_config(
    request: AlpacaConfigRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Test connection first
    client = AlpacaClient(
        api_key=request.api_key,
        api_secret=request.api_secret,
        base_url=ALPACA_PAPER_BASE if request.paper_trading else "https://api.alpaca.markets",
    )
    connected = await client.test_connection()

    result = await db.execute(
        select(AlpacaConfig).where(AlpacaConfig.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()

    if config:
        config.api_key_encrypted = request.api_key
        config.api_secret_encrypted = request.api_secret
        config.paper_trading = request.paper_trading
        config.base_url = client.base_url
        config.is_connected = connected
        config.updated_at = datetime.now(timezone.utc)
    else:
        config = AlpacaConfig(
            user_id=current_user.id,
            api_key_encrypted=request.api_key,
            api_secret_encrypted=request.api_secret,
            paper_trading=request.paper_trading,
            base_url=client.base_url,
            is_connected=connected,
        )
        db.add(config)

    await db.commit()

    return AlpacaConfigResponse(
        is_connected=connected,
        paper_trading=request.paper_trading,
        last_sync=None,
    )


@router.post("/portfolio/test")
async def test_connection(
    request: AlpacaConfigRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = AlpacaClient(
        api_key=request.api_key,
        api_secret=request.api_secret,
        base_url=ALPACA_PAPER_BASE if request.paper_trading else "https://api.alpaca.markets",
    )
    connected = await client.test_connection()
    return {"connected": connected}
