import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { api } from "@/utils/api";

const statusColors: Record<string, "default" | "destructive" | "outline" | "secondary" | "success" | "warning"> = {
  completed: "success",
  running: "default",
  failed: "destructive",
  cancelled: "secondary",
  pending: "warning",
};

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", ticker: "", page: 1 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });

  useEffect(() => {
    fetchAnalyses();
  }, [filters]);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: pagination.pageSize.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.ticker && { ticker: filters.ticker }),
      });
      const data = await api.get<any>(`/api/analyses?${params}`);
      setAnalyses(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (err) {
      console.error("Failed to fetch analyses:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationBadge = (rec: string) => {
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
          <div style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", flexWrap: "wrap" }}>
            <div style={{ minWidth: 200 }}>
              <Label htmlFor="ticker-filter" style={{ display: "block", marginBottom: "var(--space-1)" }}>Filter by Ticker</Label>
              <Input
                id="ticker-filter"
                placeholder="AAPL, TSLA..."
                value={filters.ticker}
                onChange={(e) => setFilters({ ...filters, ticker: e.target.value.toUpperCase(), page: 1 })}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <Label htmlFor="status-filter" style={{ display: "block", marginBottom: "var(--space-1)" }}>Status</Label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="input"
                style={{ width: "100%" }}
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading analyses...
            </div>
          ) : analyses.length === 0 ? (
            <div style={{ padding: "var(--space-12)", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>📊</div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>
                No analyses found
              </h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                Run your first analysis to see it here
              </p>
              <Button onClick={() => window.location.href = "/analyze"}>Run Analysis</Button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-surface)" }}>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Ticker</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Recommendation</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Confidence</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Risk</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Duration</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Date</th>
                      <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((analysis) => (
                      <tr key={analysis.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "var(--weight-medium)", fontFamily: "var(--font-mono)" }}>
                          {analysis.ticker}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <Badge variant={statusColors[analysis.status] || "secondary"}>
                            {analysis.status}
                          </Badge>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <Badge variant={getRecommendationBadge(analysis.final_recommendation)}>
                            {analysis.final_recommendation || "—"}
                          </Badge>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          {analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          {analysis.risk_score ? `${(analysis.risk_score * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
                          {analysis.duration_seconds ? `${analysis.duration_seconds.toFixed(1)}s` : "—"}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                          {format(new Date(analysis.created_at), "MMM d, yyyy HH:mm")}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                            <Button className="btn-ghost btn-sm" onClick={() => window.location.href = `/analysis/${analysis.id}`}>
                              View
                            </Button>
                            {analysis.status === "failed" && (
                              <Button className="btn-ghost btn-sm" onClick={() => retryAnalysis(analysis.id)}>
                                Retry
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.total > pagination.pageSize && (
                <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-2)", padding: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                  <Button
                    className="btn-ghost btn-sm"
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page <= 1}
                  >
                    Previous
                  </Button>
                  <span style={{ display: "flex", alignItems: "center", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                    Page {filters.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                  </span>
                  <Button
                    className="btn-ghost btn-sm"
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= Math.ceil(pagination.total / pagination.pageSize)}
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

function retryAnalysis(id: number) {
  if (confirm("Retry this analysis?")) {
    api.post(`/api/analyses/${id}/retry`).then(() => window.location.reload());
  }
}