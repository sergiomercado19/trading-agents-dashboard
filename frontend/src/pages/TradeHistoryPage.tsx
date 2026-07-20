import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import type {
  TradeHistoryItem,
  TradeHistoryResponse,
} from "@/types/portfolio";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const PAGE_SIZE = 20;

/* ---------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------- */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMoney(v: number) {
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(items: TradeHistoryItem[]) {
  const header = [
    "Date",
    "Ticker",
    "Side",
    "Qty",
    "Price",
    "Filled Price",
    "Status",
    "Type",
    "Commission",
    "Notes",
  ];
  const rows = items.map((t) => [
    t.created_at,
    t.ticker,
    t.side,
    String(t.quantity),
    String(t.price),
    t.filled_price != null ? String(t.filled_price) : "",
    t.status,
    t.order_type,
    String(t.commission),
    t.notes ?? "",
  ]);
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/* ---------------------------------------------------------------------------
| P&L analytics
|--------------------------------------------------------------------------- */

interface PnlStats {
  totalPnl: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgTrade: number;
}

function computePnl(items: TradeHistoryItem[]): PnlStats {
  let totalPnl = 0;
  let winCount = 0;
  let lossCount = 0;

  for (const t of items) {
    if (t.status === "filled" && t.filled_price != null) {
      const pnl =
        t.side === "buy"
          ? (t.price - t.filled_price) * t.quantity
          : (t.filled_price - t.price) * t.quantity;
      totalPnl += pnl - t.commission;
      if (pnl > 0) winCount++;
      else if (pnl < 0) lossCount++;
    }
  }

  const totalTrades = items.length;
  return {
    totalPnl,
    totalTrades,
    winCount,
    lossCount,
    winRate: totalTrades > 0 ? (winCount / totalTrades) * 100 : 0,
    avgTrade: totalTrades > 0 ? totalPnl / totalTrades : 0,
  };
}

/* ---------------------------------------------------------------------------
| Chart data
|--------------------------------------------------------------------------- */

interface ChartPoint {
  date: string;
  cumPnl: number;
  dailyPnl: number;
}

function buildChartData(items: TradeHistoryItem[]): ChartPoint[] {
  const sorted = [...items]
    .filter((t) => t.status === "filled" && t.filled_price != null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const dailyMap = new Map<string, number>();
  let cumPnl = 0;
  const points: ChartPoint[] = [];

  for (const t of sorted) {
    const pnl =
      t.side === "buy"
        ? (t.price - t.filled_price!) * t.quantity
        : (t.filled_price! - t.price) * t.quantity;
    cumPnl += pnl - t.commission;
    const day = t.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + pnl - t.commission);
    points.push({ date: day, cumPnl, dailyPnl: 0 });
  }

  for (const pt of points) {
    pt.dailyPnl = dailyMap.get(pt.date) ?? 0;
  }

  return points;
}

/* ---------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------- */

export default function TradeHistoryPage() {
  const [page, setPage] = useState(1);
  const [tickerFilter, setTickerFilter] = useState("");
  const [sideFilter, setSideFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const params = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      limit: String(PAGE_SIZE),
    };
    if (tickerFilter) p.ticker = tickerFilter;
    if (sideFilter) p.side = sideFilter;
    if (statusFilter) p.status = statusFilter;
    if (fromDate) p.from_date = fromDate;
    if (toDate) p.to_date = toDate;
    return p;
  }, [page, tickerFilter, sideFilter, statusFilter, fromDate, toDate]);

  const { data, isLoading, error } = useQuery<TradeHistoryResponse>({
    queryKey: ["trades", params],
    queryFn: () =>
      api.get<TradeHistoryResponse>(
        `/trades?${new URLSearchParams(params).toString()}`,
      ),
  });

  const stats = useMemo(
    () => computePnl(data?.items ?? []),
    [data],
  );

  const chartData = useMemo(
    () => buildChartData(data?.items ?? []),
    [data],
  );

  const totalPages = data?.pages ?? 1;

  function handleExportCsv() {
    if (!data?.items?.length) return;
    const csv = toCsv(data.items);
    downloadBlob(
      new Blob([csv], { type: "text/csv" }),
      `trades-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  function handleExportJson() {
    if (!data?.items?.length) return;
    const json = JSON.stringify(data.items, null, 2);
    downloadBlob(
      new Blob([json], { type: "application/json" }),
      `trades-${new Date().toISOString().slice(0, 10)}.json`,
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Trade History
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {stats.totalTrades} total trades
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* P&L Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total P&L"
          value={fmtMoney(stats.totalPnl)}
          positive={stats.totalPnl >= 0}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          positive={stats.winRate >= 50}
        />
        <StatCard
          label="Total Trades"
          value={String(stats.totalTrades)}
        />
        <StatCard
          label="Avg Trade"
          value={fmtMoney(stats.avgTrade)}
          positive={stats.avgTrade >= 0}
        />
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Cumulative P&L">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [fmtMoney(Number(v)), "P&L"]}
                />
                <ReferenceLine y={0} stroke="var(--color-text-secondary)" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="cumPnl"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily P&L">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [fmtMoney(Number(v)), "P&L"]}
                />
                <ReferenceLine y={0} stroke="var(--color-text-secondary)" strokeDasharray="3 3" />
                <Bar dataKey="dailyPnl" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <FilterInput
          label="Ticker"
          value={tickerFilter}
          onChange={(v) => { setTickerFilter(v); setPage(1); }}
          placeholder="e.g. AAPL"
        />
        <FilterSelect
          label="Side"
          value={sideFilter}
          onChange={(v) => { setSideFilter(v); setPage(1); }}
          options={[
            { value: "", label: "All" },
            { value: "buy", label: "Buy" },
            { value: "sell", label: "Sell" },
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          options={[
            { value: "", label: "All" },
            { value: "filled", label: "Filled" },
            { value: "pending", label: "Pending" },
            { value: "cancelled", label: "Cancelled" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        <FilterInput
          label="From"
          value={fromDate}
          onChange={(v) => { setFromDate(v); setPage(1); }}
          type="date"
        />
        <FilterInput
          label="To"
          value={toDate}
          onChange={(v) => { setToDate(v); setPage(1); }}
          type="date"
        />
      </div>

      {/* Trade Table */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-3 text-[var(--color-text-secondary)] font-medium">Date</th>
                <th className="text-left px-4 py-3 text-[var(--color-text-secondary)] font-medium">Ticker</th>
                <th className="text-left px-4 py-3 text-[var(--color-text-secondary)] font-medium">Side</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-secondary)] font-medium">Qty</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-secondary)] font-medium">Price</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-secondary)] font-medium">Filled Price</th>
                <th className="text-left px-4 py-3 text-[var(--color-text-secondary)] font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-secondary)] font-medium">Commission</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                    Loading trades...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-red-400">
                    Failed to load trades
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                    No trades found
                  </td>
                </tr>
              ) : (
                data?.items?.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-elevated)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">{fmtDate(t.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{t.ticker}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          t.side === "buy"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400",
                        )}
                      >
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-primary)]">{t.quantity}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-primary)]">{fmtMoney(t.price)}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {t.filled_price != null ? fmtMoney(t.filled_price) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                      {t.commission > 0 ? fmtMoney(t.commission) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
          <span>
            Page {page} of {totalPages} ({data?.total ?? 0} trades)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] disabled:opacity-40 hover:text-[var(--color-text-primary)] transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] disabled:opacity-40 hover:text-[var(--color-text-primary)] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
| Sub-components
|--------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="text-xs text-[var(--color-text-secondary)] mb-1">{label}</div>
      <div
        className="text-xl font-bold"
        style={{
          color:
            positive === undefined
              ? "var(--color-text-primary)"
              : positive
                ? "#10b981"
                : "#f43f5e",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    filled: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    cancelled: "bg-zinc-500/10 text-zinc-400",
    rejected: "bg-rose-500/10 text-rose-400",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-xs font-medium capitalize",
        colorMap[status] ?? "bg-zinc-500/10 text-zinc-400",
      )}
    >
      {status}
    </span>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
