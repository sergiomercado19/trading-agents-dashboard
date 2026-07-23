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
    <div className="max-w-[1200px] mx-auto">
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-c-text-primary mb-2">
          Welcome back, {user?.full_name?.split(" ")[0] || user?.username || "Trader"}
        </h1>
        <p className="text-lg text-c-text-secondary">
          Here's an overview of your trading dashboard
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-c-text-muted uppercase tracking-[0.05em] mb-1">
              Total Analyses
            </p>
            <p className="text-2xl font-bold text-c-text-primary">
              {stats.totalAnalyses}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-c-text-muted uppercase tracking-[0.05em] mb-1">
              Total Trades
            </p>
            <p className="text-2xl font-bold text-c-text-primary">
              {stats.totalTrades}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-c-text-muted uppercase tracking-[0.05em] mb-1">
              Portfolio Value
            </p>
            <p className="text-2xl font-bold text-c-text-primary">
              ${(stats.portfolioValue / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-c-text-muted uppercase tracking-[0.05em] mb-1">
              Win Rate
            </p>
            <p className="text-2xl font-bold text-c-text-primary">
              {stats.winRate}%
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-c-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link key={feature.link} to={feature.link} className="no-underline">
              <Card className="p-5 transition-all duration-[120ms] ease-out cursor-pointer">
                <div className="mb-3 text-c-text-muted">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-base font-semibold text-c-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-c-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-c-text-primary">
            Recent Analyses
          </h2>
          <Link to="/history"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>

        {loadingAnalyses ? (
          <Card className="p-6 text-center">
            <div className="w-6 h-6 border-2 border-c-border border-t-[var(--color-accent)] rounded-full animate-spin mx-auto" />
          </Card>
        ) : analyses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-c-text-muted mb-4">No analyses yet</p>
            <Link to="/analyze"><Button>Run Your First Analysis</Button></Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-c-border-subtle">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-muted uppercase">Ticker</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-muted uppercase">Recommendation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-c-text-muted uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-c-text-muted uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="border-b border-c-border-subtle">
                    <td className="px-4 py-3 text-sm font-medium font-mono text-c-text-primary">
                      {analysis.ticker}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadge(analysis.status)}>
                        {analysis.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-c-text-secondary">
                      {analysis.final_recommendation || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-c-text-muted">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
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
