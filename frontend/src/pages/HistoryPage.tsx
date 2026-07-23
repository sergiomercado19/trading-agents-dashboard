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
    <div className="p-6 max-w-content mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-c-text-primary mb-2">
            Analysis History
          </h1>
          <p className="text-c-text-secondary">
            Track and manage all your past analyses
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-c-border items-end">
            <div className="w-full md:w-auto md:min-w-[200px] md:flex-1">
              <Label htmlFor="ticker-search" className="block mb-1 text-xs">Ticker</Label>
              <Input
                id="ticker-search"
                placeholder="AAPL, TSLA..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-auto md:min-w-[180px]">
              <Label htmlFor="status-filter" className="block mb-1 text-xs">Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg-elevated text-c-text-primary text-sm"
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
            <div className="p-8 text-center text-c-text-muted">
              Loading analyses...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-4">&#x1F4CA;</div>
              <h3 className="text-lg font-semibold mb-2">
                No analyses found
              </h3>
              <p className="text-c-text-muted mb-4">
                Run your first analysis to see it here
              </p>
              <Button onClick={() => navigate("/analyze")}>Run Analysis</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-c-border bg-c-bg-surface">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === items.length && items.length > 0}
                          onChange={toggleSelectAll}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-secondary uppercase">Ticker</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-secondary uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-secondary uppercase">Recommendation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-secondary uppercase">Confidence</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-secondary uppercase">Risk</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-secondary uppercase">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-c-text-secondary uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((analysis) => (
                      <tr key={analysis.id} className="border-b border-c-border-subtle">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(analysis.id)}
                            onChange={() => toggleSelect(analysis.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium font-mono">
                          {analysis.ticker}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_COLORS[analysis.status] || "secondary"}>
                            {analysis.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {analysis.final_recommendation ? (
                            <Badge variant={getRecommendationBadge(analysis.final_recommendation)}>
                              {analysis.final_recommendation}
                            </Badge>
                          ) : (
                            <span className="text-c-text-muted">&#x2014;</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : <span className="text-c-text-muted">&#x2014;</span>}
                        </td>
                        <td className="px-4 py-3">
                          {analysis.risk_score ? `${(analysis.risk_score * 100).toFixed(0)}%` : <span className="text-c-text-muted">&#x2014;</span>}
                        </td>
                        <td className="px-4 py-3 text-c-text-secondary text-sm">
                          {analysis.created_at ? new Date(analysis.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "\u2014"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/analysis/${analysis.id}`)}>
                              View
                            </Button>
                            {["failed", "cancelled", "stale"].includes(analysis.status) && (
                              <Button variant="ghost" size="sm" onClick={() => retryMutation.mutate(analysis.id)} disabled={retryMutation.isPending}>
                                Retry
                              </Button>
                            )}
                            {["running", "pending"].includes(analysis.status) && (
                              <Button variant="ghost" size="sm" onClick={() => cancelMutation.mutate(analysis.id)} disabled={cancelMutation.isPending}>
                                Cancel
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
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
                <div className="flex justify-center items-center gap-3 p-4 border-t border-c-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-c-text-secondary text-sm">
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
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
