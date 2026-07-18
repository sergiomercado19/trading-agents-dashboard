from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum, Integer, Boolean, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    STALE = "stale"


class AgentPhase(str, enum.Enum):
    DATA_ANALYSIS = "data_analysis"
    RESEARCH = "research"
    TRADING = "trading"
    RISK = "risk"
    PORTFOLIO = "portfolio"


class AgentStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    analyses: Mapped[List["Analysis"]] = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    api_keys: Mapped[List["APIKey"]] = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    trades: Mapped[List["Trade"]] = relationship("Trade", back_populates="user", cascade="all, delete-orphan")
    alpaca_config: Mapped[Optional["AlpacaConfig"]] = relationship("AlpacaConfig", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ai_config: Mapped[Optional["AIConfig"]] = relationship("AIConfig", back_populates="user", uselist=False, cascade="all, delete-orphan")


class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="api_keys")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[AnalysisStatus] = mapped_column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING, nullable=False, index=True)
    current_phase: Mapped[Optional[AgentPhase]] = mapped_column(Enum(AgentPhase), nullable=True)
    current_agent: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Configuration snapshot
    config_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Results
    final_recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    risk_score: Mapped[Optional[float]] = mapped_column(nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="analyses")
    agents: Mapped[List["AnalysisAgent"]] = relationship("AnalysisAgent", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisAgent.sequence")
    trades: Mapped[List["Trade"]] = relationship("Trade", back_populates="analysis", cascade="all, delete-orphan")


class AnalysisAgent(Base):
    __tablename__ = "analysis_agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    analysis_id: Mapped[int] = mapped_column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phase: Mapped[AgentPhase] = mapped_column(Enum(AgentPhase), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[AgentStatus] = mapped_column(Enum(AgentStatus), default=AgentStatus.PENDING, nullable=False)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    input_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    output_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost_usd: Mapped[float] = mapped_column(default=0.0, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="agents")


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    analysis_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True, index=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    side: Mapped[str] = mapped_column(String(10), nullable=False)  # buy, sell
    quantity: Mapped[float] = mapped_column(nullable=False)
    price: Mapped[float] = mapped_column(nullable=False)
    order_type: Mapped[str] = mapped_column(String(20), nullable=False)  # market, limit, stop
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending, filled, cancelled, rejected
    alpaca_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    filled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    filled_price: Mapped[Optional[float]] = mapped_column(nullable=True)
    filled_quantity: Mapped[Optional[float]] = mapped_column(nullable=True)
    commission: Mapped[float] = mapped_column(default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="trades")
    analysis: Mapped[Optional["Analysis"]] = relationship("Analysis", back_populates="trades")


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(nullable=False)
    avg_entry_price: Mapped[float] = mapped_column(nullable=False)
    current_price: Mapped[Optional[float]] = mapped_column(nullable=True)
    market_value: Mapped[Optional[float]] = mapped_column(nullable=True)
    unrealized_pl: Mapped[Optional[float]] = mapped_column(nullable=True)
    unrealized_plpc: Mapped[Optional[float]] = mapped_column(nullable=True)
    side: Mapped[str] = mapped_column(String(10), nullable=False)  # long, short
    asset_class: Mapped[str] = mapped_column(String(20), default="us_equity", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (Index("ix_positions_user_ticker", "user_id", "ticker", unique=True),)


class AlpacaConfig(Base):
    __tablename__ = "alpaca_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    api_key_encrypted: Mapped[str] = mapped_column(String(500), nullable=False)
    api_secret_encrypted: Mapped[str] = mapped_column(String(500), nullable=False)
    paper_trading: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    base_url: Mapped[str] = mapped_column(String(255), default="https://paper-api.alpaca.markets", nullable=False)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_sync: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="alpaca_config")


class AIConfig(Base):
    __tablename__ = "ai_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    default_provider: Mapped[str] = mapped_column(String(50), default="openai", nullable=False)
    default_model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini", nullable=False)

    # Per-agent configuration
    agent_configs: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Provider API keys (encrypted)
    openai_api_key_encrypted: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    anthropic_api_key_encrypted: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    google_api_key_encrypted: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    deepseek_api_key_encrypted: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Provider failover
    failover_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failover_order: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="ai_config")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))