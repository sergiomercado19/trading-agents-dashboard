# Key Integration Points (Reuse Existing Code)

| TradingAgents Module | Usage in Web UI |
|----------------------|-----------------|
| `tradingagents.graph.trading_graph.TradingAgentsGraph` | Core analysis engine — instantiate per run |
| `tradingagents.graph.checkpointer` | Checkpoint/resume support |
| `tradingagents.graph.signal_processing.SignalProcessor` | Technical analysis signal generation |
| `tradingagents.graph.reflection.Reflector` | Post-trade reflection and memory |
| `tradingagents.graph.conditional_logic.ConditionalLogic` | Graph routing decisions |
| `tradingagents.llm_clients.factory.create_llm_client` | Provider/model validation |
| `tradingagents.llm_clients.model_catalog.MODEL_OPTIONS` | Model dropdown options |
| `tradingagents.llm_clients.api_key_env.PROVIDER_API_KEY_ENV` | Env var mapping for API keys |
| `tradingagents.default_config.DEFAULT_CONFIG` | Base config + env overrides |
| `tradingagents.reporting.write_report_tree` | Report persistence |
| `tradingagents.agents.utils.memory.FinancialSituationMemory` | ChromaDB RAG with Obsidian vault sync |
| `tradingagents.agents.utils.agent_utils` | Stock data, indicators, fundamentals, news, insider sentiment |
| `tradingagents.agents.utils.fundamental_data_tools` | Balance sheet, cashflow, income statement |
| `tradingagents.agents.utils.technical_indicators_tools` | Technical analysis via StockStats |
| `tradingagents.agents.utils.news_data_tools` | News aggregation and retrieval |
| `tradingagents.agents.utils.core_stock_tools` | Core stock data API abstraction |
| `tradingagents.agents.managers.fact_checker` | URL verification agent |
| `tradingagents.agents.managers.research_manager` | Bull/Bear debate orchestration |
| `tradingagents.agents.managers.risk_manager` | Risk profile assessment |
| `tradingagents.agents.analysts.*` | Market, social, news, fundamentals analysts |
| `tradingagents.agents.researchers.*` | Bull/Bear researchers |
| `tradingagents.agents.trader.trader` | Final trading decision execution |
| `tradingagents.dataflows.*` | 18+ data source integrations |
