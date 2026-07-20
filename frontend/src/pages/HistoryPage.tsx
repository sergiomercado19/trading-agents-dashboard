import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";
import type { AnalysisListItem, PaginatedResponse } from "@/types/analysis";

const STATUS_COLORS: Record<string, "default" | "destructive" | "outline" | "secondary" | "success" | "warning"> = {
  completed: "success",
  running: "default",
  failed: "destructive",
  cancelled: "secondary",
  pending: "warning",
  stale: "outline",
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [tickerFilter, setTickerFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced ticker search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setTickerFilter(searchInput);
      setPage(1);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["analyses", page, statusFilter, tickerFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (tickerFilter) params.set("ticker", tickerFilter);
      return api.get<PaginatedResponse<AnalysisListItem>>(`/api/analysis?${params}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/analysis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(selectedIds.values().next().value!); return next; });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.post<{ deleted: number }>("/api/analysis/bulk-delete", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      setSelectedIds(new Set());
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: number) => api.post<{ analysis_id: number }>(`/api/analysis/${id}/retry`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      navigate(`/analysis/${data.analysis_id}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/analysis/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analyses"] }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((a) => a.id)));
    }
  };

  const getRecommendationBadge = (rec: string | null) => {
    switch (rec?.toLowerCase()) {
      case "buy": return "success";
      case "sell": return "destructive";
      default: return "warning";
    }
  };

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
            Analysis History
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Track and manage all your past analyses
          </p>
        </div>
      </div>

      <Card>
        <CardContent style={{ padding: 0 }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <Label htmlFor="ticker-search" style={{ display: "block", marginBottom: "var(--space-1)", fontSize: "var(--text-xs)" }}>Ticker</Label>
              <Input
                id="ticker-search"
                placeholder="AAPL, TSLA..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <Label htmlFor="status-filter" style={{ display: "block", marginBottom: "var(--space-1)", fontSize: "var(--text-xs)" }}>Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="stale">Stale</option>
              </select>
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.size} analysis(es)?`)) {
                    bulkDeleteMutation.mutate(Array.from(selectedIds));
                  }
                }}
                disabled={bulkDeleteMutation.isPending}
              >
                Delete {selectedIds.size}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading analyses...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: "var(--space-12)", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>&#x1F4CA;</div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>
                No analyses found
              </h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                Run your first analysis to see it here
              </p>
              <Button onClick={() => navigate("/analyze")}>Run Analysis</Button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-surface)" }}>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === items.length && items.length > 0}
                          onChange={toggleSelectAll}
                          style={{ cursor: "pointer" }}
                        />
                      </th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Ticker</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Recommendation</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Confidence</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Risk</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Date</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((analysis) => (
                      <tr key={analysis.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(analysis.id)}
                            onChange={() => toggleSelect(analysis.id)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "var(--weight-medium)", fontFamily: "var(--font-mono)" }}>
                          {analysis.ticker}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <Badge variant={STATUS_COLORS[analysis.status] || "secondary"}>
                            {analysis.status}
                          </Badge>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          {analysis.final_recommendation ? (
                            <Badge variant={getRecommendationBadge(analysis.final_recommendation)}>
                              {analysis.final_recommendation}
                            </Badge>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)" }}>&#x2014;</span>
                          )}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          {analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : <span style={{ color: "var(--color-text-muted)" }}>&#x2014;</span>}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          {analysis.risk_score ? `${(analysis.risk_score * 100).toFixed(0)}%` : <span style={{ color: "var(--color-text-muted)" }}>&#x2014;</span>}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                          {analysis.created_at ? new Date(analysis.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "\u2014"}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                            <Button className="btn-ghost btn-sm" onClick={() => navigate(`/analysis/${analysis.id}`)}>
                              View
                            </Button>
                            {["failed", "cancelled", "stale"].includes(analysis.status) && (
                              <Button className="btn-ghost btn-sm" onClick={() => retryMutation.mutate(analysis.id)} disabled={retryMutation.isPending}>
                                Retry
                              </Button>
                            )}
                            {["running", "pending"].includes(analysis.status) && (
                              <Button className="btn-ghost btn-sm" onClick={() => cancelMutation.mutate(analysis.id)} disabled={cancelMutation.isPending}>
                                Cancel
                              </Button>
                            )}
                            <Button className="btn-ghost btn-sm" style={{ color: "var(--color-error)" }} onClick={() => {
                              if (confirm("Delete this analysis?")) deleteMutation.mutate(analysis.id);
                            }} disabled={deleteMutation.isPending}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                  <Button
                    className="btn-ghost btn-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <Button
                    className="btn-ghost btn-sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
