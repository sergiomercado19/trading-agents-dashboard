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
      <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "var(--space-6)" }}>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
            Portfolio
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Paper trading via Alpaca
          </p>
        </div>
        <Card>
          <CardContent style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)", color: "var(--color-text-muted)" }}><LinkIcon size={48} /></div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)", color: "var(--color-text-primary)" }}>
                Alpaca Not Configured
              </h3>
              <p style={{ color: "var(--color-text-muted)", maxWidth: 400, margin: "0 auto", marginBottom: "var(--space-4)" }}>
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
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              Portfolio
            </h1>
            <Badge variant={config?.paper_trading !== false ? "outline" : "default"}>
              {config?.paper_trading !== false ? "Paper" : "Live"}
            </Badge>
          </div>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Paper trading via Alpaca
          </p>
        </div>
        <Button onClick={() => setShowTradeModal(true)}>New Trade</Button>
      </div>

      {fetchError && (
        <div style={{ padding: "var(--space-3)", background: "var(--color-error-subtle)", color: "var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
          {fetchError}
        </div>
      )}

      {/* Account Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "var(--space-1)" }}>Equity</div>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              ${account?.equity?.toLocaleString() ?? "\u2014"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "var(--space-1)" }}>Buying Power</div>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              ${account?.buying_power?.toLocaleString() ?? "\u2014"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "var(--space-1)" }}>Day P&L</div>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: (account?.day_pnl ?? 0) >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
              ${(account?.day_pnl ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "var(--space-1)" }}>Unrealized P&L</div>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: totalUnrealizedPL >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
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
        <CardContent style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading positions...
            </div>
          ) : positions.length === 0 ? (
            <div style={{ padding: "var(--space-12)", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>&#x1F4C8;</div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>
                No open positions
              </h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                Start trading to build your portfolio
              </p>
              <Button onClick={() => setShowTradeModal(true)}>Place First Trade</Button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-surface)" }}>
                    <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Symbol</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Qty</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Avg Entry</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Current</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Market Value</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Unrealized P&L</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.symbol} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                      <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                        {position.symbol}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                        {position.qty}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>
                        ${position.avg_entry_price?.toFixed(2)}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", fontWeight: "var(--weight-medium)" }}>
                        ${position.current_price?.toFixed(2)}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", fontWeight: "var(--weight-medium)" }}>
                        ${position.market_value?.toLocaleString()}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>
                        <span style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-medium)", color: (position.unrealized_pl || 0) >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
                          ${position.unrealized_pl?.toFixed(2)} ({(position.unrealized_plpc || 0).toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "var(--space-4)" }}>
          <Card style={{ width: "100%", maxWidth: 400 }}>
            <form id="trade-form" onSubmit={handleTrade}>
              <CardHeader>
                <CardTitle>New Trade</CardTitle>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input id="symbol" value={tradeForm.symbol} onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value.toUpperCase() })} placeholder="AAPL" required autoFocus />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <Label htmlFor="qty">Quantity</Label>
                    <Input id="qty" type="number" step="1" min="1" value={tradeForm.qty} onChange={(e) => setTradeForm({ ...tradeForm, qty: e.target.value })} placeholder="10" required />
                  </div>
                  <div>
                    <Label htmlFor="side">Side</Label>
                    <select id="side" value={tradeForm.side} onChange={(e) => setTradeForm({ ...tradeForm, side: e.target.value as "buy" | "sell" })} style={{ width: "100%", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-elevated)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="type">Order Type</Label>
                  <select id="type" value={tradeForm.type} onChange={(e) => setTradeForm({ ...tradeForm, type: e.target.value as "market" | "limit" })} style={{ width: "100%", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-elevated)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>
                {tradeError && (
                  <div style={{ padding: "var(--space-3)", background: "var(--color-error-subtle)", color: "var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)" }}>
                    {tradeError}
                  </div>
                )}
              </CardContent>
              <CardFooter style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
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
