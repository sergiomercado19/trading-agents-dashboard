import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import type { Position, Account, TradeForm, AlpacaConfig } from "@/types/portfolio";
import { LinkIcon } from "lucide-react";

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [config, setConfig] = useState<AlpacaConfig | null>(null);
  const [tradeForm, setTradeForm] = useState<TradeForm>({ symbol: "", qty: "", side: "buy", type: "market" });
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const cfg = await api.get<AlpacaConfig>("/api/portfolio/config");
      setConfig(cfg);
      if (cfg.is_connected) {
        fetchPortfolio();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    setFetchError("");
    try {
      const [positionsData, accountData] = await Promise.all([
        api.get<Position[]>("/api/portfolio/positions"),
        api.get<Account>("/api/portfolio/account"),
      ]);
      setPositions(positionsData);
      setAccount(accountData);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradeError("");
    try {
      await api.post("/api/trades", {
        symbol: tradeForm.symbol.toUpperCase(),
        qty: parseInt(tradeForm.qty, 10),
        side: tradeForm.side,
        type: tradeForm.type,
      });
      setShowTradeModal(false);
      setTradeForm({ symbol: "", qty: "", side: "buy", type: "market" });
      fetchPortfolio();
    } catch (err: any) {
      setTradeError(err.message || "Trade failed");
    }
  };

  const handleClosePosition = async (symbol: string, qty: number) => {
    if (!confirm(`Close entire position of ${qty} shares of ${symbol}?`)) return;
    try {
      await api.post("/api/trades", {
        symbol,
        qty: Math.abs(Math.floor(qty)),
        side: qty > 0 ? "sell" : "buy",
        type: "market",
      });
      fetchPortfolio();
    } catch (err: any) {
      setFetchError(err.message || "Close position failed");
    }
  };

  const totalValue = positions.reduce((sum, p) => sum + (p.market_value || 0), 0);
  const totalUnrealizedPL = positions.reduce((sum, p) => sum + (p.unrealized_pl || 0), 0);
  const totalUnrealizedPLPC = totalValue > 0 ? (totalUnrealizedPL / (totalValue - totalUnrealizedPL)) * 100 : 0;

  if (!config?.is_connected && !loading) {
    return (
      <div className="p-6 max-w-content mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-c-text-primary mb-2">
            Portfolio
          </h1>
          <p className="text-c-text-secondary">
            Paper trading via Alpaca
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px] text-center">
            <div>
              <div className="text-[4rem] mb-4 text-c-text-muted"><LinkIcon size={48} /></div>
              <h3 className="text-lg font-semibold mb-2 text-c-text-primary">
                Alpaca Not Configured
              </h3>
              <p className="text-c-text-muted max-w-panel mx-auto mb-4">
                Connect your Alpaca paper trading account to view positions and execute trades.
              </p>
              <Button onClick={() => window.location.href = "/settings"}>Configure Alpaca</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-content mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-c-text-primary">
              Portfolio
            </h1>
            <Badge variant={config?.paper_trading !== false ? "outline" : "default"}>
              {config?.paper_trading !== false ? "Paper" : "Live"}
            </Badge>
          </div>
          <p className="text-c-text-secondary">
            Paper trading via Alpaca
          </p>
        </div>
        <Button onClick={() => setShowTradeModal(true)}>New Trade</Button>
      </div>

      {fetchError && (
        <div className="p-3 bg-c-error/12 text-c-error rounded-md text-sm mb-4">
          {fetchError}
        </div>
      )}

      {/* Account Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-c-text-muted uppercase mb-1">Equity</div>
            <div className="text-2xl font-bold text-c-text-primary">
              ${account?.equity?.toLocaleString() ?? "\u2014"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-c-text-muted uppercase mb-1">Buying Power</div>
            <div className="text-2xl font-bold text-c-text-primary">
              ${account?.buying_power?.toLocaleString() ?? "\u2014"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-c-text-muted uppercase mb-1">Day P&L</div>
            <div className={`text-2xl font-bold ${(account?.day_pnl ?? 0) >= 0 ? 'text-c-success' : 'text-c-error'}`}>
              ${(account?.day_pnl ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-c-text-muted uppercase mb-1">Unrealized P&L</div>
            <div className={`text-2xl font-bold ${totalUnrealizedPL >= 0 ? 'text-c-success' : 'text-c-error'}`}>
              ${totalUnrealizedPL.toLocaleString()} ({totalUnrealizedPLPC.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>{positions.length} open position{positions.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-c-text-muted">
              Loading positions...
            </div>
          ) : positions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-[3rem] mb-4">&#x1F4C8;</div>
              <h3 className="text-lg font-semibold mb-2">
                No open positions
              </h3>
              <p className="text-c-text-muted mb-4">
                Start trading to build your portfolio
              </p>
              <Button onClick={() => setShowTradeModal(true)}>Place First Trade</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-c-border bg-c-bg-surface">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-c-text-secondary uppercase">Symbol</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-c-text-secondary uppercase">Qty</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-c-text-secondary uppercase">Avg Entry</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-c-text-secondary uppercase">Current</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-c-text-secondary uppercase">Market Value</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-c-text-secondary uppercase">Unrealized P&L</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-c-text-secondary uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.symbol} className="border-b border-c-border-subtle">
                      <td className="py-3 px-4 text-sm font-medium font-mono text-c-text-primary">
                        {position.symbol}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-c-text-primary">
                        {position.qty}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-c-text-secondary">
                        ${position.avg_entry_price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-c-text-primary font-medium">
                        ${position.current_price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-c-text-primary font-medium">
                        ${position.market_value?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-mono font-medium ${(position.unrealized_pl || 0) >= 0 ? 'text-c-success' : 'text-c-error'}`}>
                          ${position.unrealized_pl?.toFixed(2)} ({(position.unrealized_plpc || 0).toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleClosePosition(position.symbol, position.qty)}>
                          Close
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-panel">
            <form id="trade-form" onSubmit={handleTrade}>
              <CardHeader>
                <CardTitle>New Trade</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input id="symbol" value={tradeForm.symbol} onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value.toUpperCase() })} placeholder="AAPL" required autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="qty">Quantity</Label>
                    <Input id="qty" type="number" step="1" min="1" value={tradeForm.qty} onChange={(e) => setTradeForm({ ...tradeForm, qty: e.target.value })} placeholder="10" required />
                  </div>
                  <div>
                    <Label htmlFor="side">Side</Label>
                    <select id="side" value={tradeForm.side} onChange={(e) => setTradeForm({ ...tradeForm, side: e.target.value as "buy" | "sell" })} className="w-full rounded-md border border-c-border bg-c-bg-elevated text-c-text-primary px-3 py-2 text-sm">
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="type">Order Type</Label>
                  <select id="type" value={tradeForm.type} onChange={(e) => setTradeForm({ ...tradeForm, type: e.target.value as "market" | "limit" })} className="w-full rounded-md border border-c-border bg-c-bg-elevated text-c-text-primary px-3 py-2 text-sm">
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>
                {tradeError && (
                  <div className="p-3 bg-c-error/12 text-c-error rounded-md text-sm">
                    {tradeError}
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2 justify-end">
                <Button variant="ghost" type="button" onClick={() => { setShowTradeModal(false); setTradeError(""); }}>Cancel</Button>
                <Button type="submit">Submit Trade</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
