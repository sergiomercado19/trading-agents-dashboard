export interface Position {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  side: string;
}

export interface Account {
  equity: number;
  buying_power: number;
  day_pnl: number;
  portfolio_value: number;
  status: string;
}

export interface Trade {
  id: number;
  ticker: string;
  side: string;
  quantity: number;
  price: number;
  order_type: string;
  status: string;
  filled_at: string | null;
  filled_price: number | null;
  filled_quantity: number | null;
  commission: number;
  notes: string | null;
  alpaca_order_id: string | null;
  created_at: string;
}

export interface TradeHistoryItem {
  id: number;
  ticker: string;
  side: string;
  quantity: number;
  price: number;
  order_type: string;
  status: string;
  filled_at: string | null;
  filled_price: number | null;
  filled_quantity: number | null;
  commission: number;
  notes: string | null;
  created_at: string;
}

export interface TradeHistoryResponse {
  items: TradeHistoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AlpacaConfig {
  is_connected: boolean;
  paper_trading: boolean;
  last_sync: string | null;
}

export interface TradeForm {
  symbol: string;
  qty: string;
  side: "buy" | "sell";
  type: "market" | "limit";
}
