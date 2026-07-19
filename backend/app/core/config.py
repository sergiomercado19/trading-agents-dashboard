from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://trading:trading@localhost:5432/trading_agents",
        validation_alias="DATABASE_URL"
    )

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")

    # JWT
    jwt_secret_key: str = Field(
        default="your-super-secret-jwt-key-change-in-production-min-32-chars",
        validation_alias="JWT_SECRET_KEY"
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=30, validation_alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(default=7, validation_alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS")

    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
        validation_alias="CORS_ORIGINS"
    )
    cors_allow_credentials: bool = Field(default=True, validation_alias="CORS_ALLOW_CREDENTIALS")

    # Backend
    backend_host: str = Field(default="0.0.0.0", validation_alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, validation_alias="BACKEND_PORT")
    backend_reload: bool = Field(default=True, validation_alias="BACKEND_RELOAD")
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")

    # Alpaca
    alpaca_api_key: str = Field(default="", validation_alias="ALPACA_API_KEY")
    alpaca_api_secret: str = Field(default="", validation_alias="ALPACA_API_SECRET")
    alpaca_paper: bool = Field(default=True, validation_alias="ALPACA_PAPER")
    alpaca_base_url: str = Field(default="https://paper-api.alpaca.markets", validation_alias="ALPACA_BASE_URL")

    # AI Providers
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", validation_alias="OPENAI_MODEL")
    anthropic_api_key: str = Field(default="", validation_alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", validation_alias="ANTHROPIC_MODEL")
    google_api_key: str = Field(default="", validation_alias="GOOGLE_API_KEY")
    google_model: str = Field(default="gemini-1.5-pro", validation_alias="GOOGLE_MODEL")
    deepseek_api_key: str = Field(default="", validation_alias="DEEPSEEK_API_KEY")
    deepseek_model: str = Field(default="deepseek-chat", validation_alias="DEEPSEEK_MODEL")

    # NVIDIA NIM
    nvidia_api_key: str = Field(default="", validation_alias="NVIDIA_API_KEY")
    nvidia_model: str = Field(default="nvidia/nemotron-3-ultra-550b-a55b", validation_alias="NVIDIA_MODEL")

    # OpenRouter
    openrouter_api_key: str = Field(default="", validation_alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openai/gpt-4o", validation_alias="OPENROUTER_MODEL")

    # Default AI Config
    default_ai_provider: str = Field(default="openai", validation_alias="DEFAULT_AI_PROVIDER")
    default_model: str = Field(default="gpt-4o-mini", validation_alias="DEFAULT_MODEL")

    # Per-Agent Token Limits
    agent_max_tokens: int = Field(default=4000, validation_alias="AGENT_MAX_TOKENS")
    researcher_max_tokens: int = Field(default=8000, validation_alias="RESEARCHER_MAX_TOKENS")
    trader_max_tokens: int = Field(default=4000, validation_alias="TRADER_MAX_TOKENS")
    risk_manager_max_tokens: int = Field(default=6000, validation_alias="RISK_MANAGER_MAX_TOKENS")
    portfolio_manager_max_tokens: int = Field(default=6000, validation_alias="PORTFOLIO_MANAGER_MAX_TOKENS")

    # Per-Agent Temperature
    agent_temperature: float = Field(default=0.3, validation_alias="AGENT_TEMPERATURE")
    researcher_temperature: float = Field(default=0.4, validation_alias="RESEARCHER_TEMPERATURE")
    trader_temperature: float = Field(default=0.2, validation_alias="TRADER_TEMPERATURE")
    risk_temperature: float = Field(default=0.1, validation_alias="RISK_TEMPERATURE")

    # Perplexity / Perplefina
    perplefina_url: str = Field(default="http://localhost:3000", validation_alias="PERPLEFINA_URL")
    perplefina_enabled: bool = Field(default=True, validation_alias="PERPLEFINA_ENABLED")

    # WebSocket
    ws_heartbeat_interval: int = Field(default=30, validation_alias="WS_HEARTBEAT_INTERVAL")
    ws_max_connections: int = Field(default=100, validation_alias="WS_MAX_CONNECTIONS")
    ws_message_queue_size: int = Field(default=1000, validation_alias="WS_MESSAGE_QUEUE_SIZE")

    # Logging
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    log_format: str = Field(default="json", validation_alias="LOG_FORMAT")

    # Feature Flags
    enable_paper_trading: bool = Field(default=True, validation_alias="ENABLE_PAPER_TRADING")
    enable_perplefina: bool = Field(default=True, validation_alias="ENABLE_PERPLEFINA")
    enable_analysis_history: bool = Field(default=True, validation_alias="ENABLE_ANALYSIS_HISTORY")
    enable_websockets: bool = Field(default=True, validation_alias="ENABLE_WEBSOCKETS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()