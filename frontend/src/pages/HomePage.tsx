import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, BarChart3, Briefcase, Settings } from "lucide-react";

export default function HomePage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    totalTrades: 0,
    portfolioValue: 0,
    winRate: 0,
  });
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [analysesRes, tradesRes, positionsRes] = await Promise.all([
          api.get<any>("/api/analyses?limit=1"),
          api.get<any>("/api/trades?limit=1"),
          api.get<any[]>("/api/portfolio/positions"),
        ]);

        setStats({
          totalAnalyses: analysesRes.total || 0,
          totalTrades: tradesRes.total || 0,
          portfolioValue: positionsRes.reduce((sum, p) => sum + (p.market_value || 0), 0),
          winRate: 0,
        });

        if (analysesRes.items) {
          setAnalyses(analysesRes.items.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoadingAnalyses(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const features = [
    {
      title: "Multi-Agent Analysis",
      description: "Run comprehensive analysis with 13 specialized agents across data, research, trading, risk, and portfolio phases.",
      icon: Bot,
      link: "/analyze",
    },
    {
      title: "Analysis History",
      description: "Track, retry, and manage all your past analyses with detailed agent outputs and visualizations.",
      icon: BarChart3,
      link: "/history",
    },
    {
      title: "Paper Trading",
      description: "Execute paper trades via Alpaca with real-time P&L tracking and portfolio management.",
      icon: Briefcase,
      link: "/portfolio",
    },
    {
      title: "AI Configuration",
      description: "Configure AI providers, per-agent models, token limits, and provider failover settings.",
      icon: Settings,
      link: "/settings",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "running": return "default";
      case "failed": return "destructive";
      case "cancelled": return "secondary";
      case "pending": return "warning";
      default: return "secondary";
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <section style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
          Welcome back, {user?.full_name?.split(" ")[0] || user?.username || "Trader"}
        </h1>
        <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-secondary)" }}>
          Here's an overview of your trading dashboard
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>
              Total Analyses
            </p>
            <p style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              {stats.totalAnalyses}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>
              Total Trades
            </p>
            <p style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              {stats.totalTrades}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>
              Portfolio Value
            </p>
            <p style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              ${(stats.portfolioValue / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "var(--space-5)" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>
              Win Rate
            </p>
            <p style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              {stats.winRate}%
            </p>
          </CardContent>
        </Card>
      </section>

      <section style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link key={feature.link} to={feature.link} style={{ textDecoration: "none" }}>
              <Card style={{ padding: "var(--space-5)", transition: "all var(--duration-fast) var(--ease-out)", cursor: "pointer" }}>
                <div style={{ marginBottom: "var(--space-3)", color: "var(--color-text-muted)" }}>
                  <feature.icon size={28} />
                </div>
                <h3 style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)" }}>
                  {feature.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
            Recent Analyses
          </h2>
          <Link to="/history"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>

        {loadingAnalyses ? (
          <Card style={{ padding: "var(--space-6)", textAlign: "center" }}>
            <div style={{ width: 24, height: 24, border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </Card>
        ) : analyses.length === 0 ? (
          <Card style={{ padding: "var(--space-8)", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>No analyses yet</p>
            <Link to="/analyze"><Button>Run Your First Analysis</Button></Link>
          </Card>
        ) : (
          <Card style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Ticker</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Recommendation</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase" }}></th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => (
                  <tr key={analysis.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                      {analysis.ticker}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <Badge variant={getStatusBadge(analysis.status)}>
                        {analysis.status}
                      </Badge>
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {analysis.final_recommendation || "—"}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>
                      <Link to={`/history/${analysis.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
