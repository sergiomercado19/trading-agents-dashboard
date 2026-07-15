import { useState, useEffect, useMemo } from "react";
import { fetchJson } from "../api/client";
import { useDebateTranscript, type Transcript } from "../hooks/useDebateTranscript";
import { useSummary } from "../hooks/useSummary";
import ReportReader from "../components/ReportReader";
import FactCheckBadge from "../components/FactCheckBadge";
import type { FactCheckStatus } from "../components/FactCheckBadge";

interface ReportMeta {
  id: string;
  ticker: string;
  date: string;
  path: string;
  size_bytes: number;
  modified: number;
}

interface UrlCheck {
  url: string;
  status: FactCheckStatus;
  status_code: number | null;
}

function formatDate(dateStr: string): string {
  const cleaned = dateStr.replace(/_/g, " ");
  const match = cleaned.match(/(\d{4})(\d{2})(\d{2})\s*(\d{2})(\d{2})(\d{2})/);
  if (!match) return cleaned;
  const [, y, m, d, h, min, s] = match;
  const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " " + dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selected, setSelected] = useState<ReportMeta | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDebate, setShowDebate] = useState(false);
  const [urlChecks, setUrlChecks] = useState<UrlCheck[]>([]);
  const [checkingUrls, setCheckingUrls] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [tickerNames, setTickerNames] = useState<Record<string, string>>({});

  const { transcript: debate } = useDebateTranscript(selected?.id || null);
  const { summary } = useSummary(selected?.id || null);

  useEffect(() => {
    fetchJson<Record<string, string>>("/ticker/names").then(setTickerNames).catch(() => {});
  }, []);

  useEffect(() => {
    fetchJson<ReportMeta[]>("/reports").then(setReports).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetchJson<{ path: string; content: string }>(`/reports/read?path=${encodeURIComponent(selected.path)}`)
      .then((d) => { setContent(d.content || ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selected]);

  const tickerGroups = useMemo(() => {
    const groups: Record<string, ReportMeta[]> = {};
    for (const r of reports) {
      const arr = groups[r.ticker];
      if (arr) {
        arr.push(r);
      } else {
        groups[r.ticker] = [r];
      }
    }
    for (const ticker of Object.keys(groups)) {
      groups[ticker]?.sort((a, b) => b.modified - a.modified);
    }
    return groups;
  }, [reports]);

  const sortedTickers = useMemo(() => Object.keys(tickerGroups).sort(), [tickerGroups]);

  const tickerReports = selectedTicker ? tickerGroups[selectedTicker] || [] : [];

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowTimestamps(true);
  };

  const handleBackToTickers = () => {
    setShowTimestamps(false);
    setSelectedTicker(null);
  };

  const handleReportClick = (report: ReportMeta) => {
    setSelected(report);
    setShowDebate(false);
  };

  const handleExport = (fmt: string) => {
    if (!selected) return;
    window.open(`/api/reports/export?path=${encodeURIComponent(selected.path)}&format=${fmt}`, "_blank");
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Delete report ${selected.id}?`)) return;
    await fetch("/api/reports/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selected.path }),
    });
    setReports((prev) => prev.filter((r) => r.id !== selected.id));
    setSelected(null);
    setContent("");
  };

  const handleCheckUrls = async () => {
    if (!selected) return;
    setCheckingUrls(true);
    try {
      const data = await fetchJson<{ urls: UrlCheck[] }>(`/reports/check_urls?path=${encodeURIComponent(selected.path)}`);
      setUrlChecks(data.urls || []);
    } catch {
      setUrlChecks([]);
    }
    setCheckingUrls(false);
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* ── Sidebar ── */}
      <div
        style={{
          width: 280,
          minWidth: 280,
          borderRight: "1px solid var(--color-border-subtle)",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-bg-surface)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="panel-header">
          <span className="panel-title">Reports</span>
          <span className="badge" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>
            {reports.length}
          </span>
        </div>

        {/* ── Layer 1: Ticker list ── */}
        <div
          style={{
            position: "absolute",
            top: 41,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            opacity: showTimestamps ? 0 : 1,
            transform: showTimestamps ? "translateX(-20px)" : "translateX(0)",
            transition: "opacity var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)",
            pointerEvents: showTimestamps ? "none" : "auto",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-2)" }}>
            {sortedTickers.map((ticker) => {
              const reports_for_ticker = tickerGroups[ticker] ?? [];
              const companyName = tickerNames[ticker];
              return (
                <div
                  key={ticker}
                  onClick={() => handleTickerClick(ticker)}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    marginBottom: "var(--space-1)",
                    transition: "background var(--duration-fast) var(--ease-out)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-md)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                      {ticker}
                    </span>
                    <span className="badge" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-faint)", fontSize: "var(--text-xs)" }}>
                      {reports_for_ticker.length}
                    </span>
                  </div>
                  {companyName && (
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                      {companyName}
                    </div>
                  )}
                </div>
              );
            })}
            {sortedTickers.length === 0 && (
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", padding: "var(--space-3)" }}>
                No reports found.
              </div>
            )}
          </div>
        </div>

        {/* ── Layer 2: Timestamp list (morphs in) ── */}
        <div
          style={{
            position: "absolute",
            top: 41,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            opacity: showTimestamps ? 1 : 0,
            transform: showTimestamps ? "translateX(0)" : "translateX(20px)",
            transition: "opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out)",
            transitionDelay: showTimestamps ? "150ms" : "0ms",
            pointerEvents: showTimestamps ? "auto" : "none",
          }}
        >
          {/* Back header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              borderBottom: "1px solid var(--color-border-subtle)",
              cursor: "pointer",
              transition: "background var(--duration-fast) var(--ease-out)",
            }}
            onClick={handleBackToTickers}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>←</span>
            <span style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
              {selectedTicker}
            </span>
            {selectedTicker && tickerNames[selectedTicker] && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginLeft: "var(--space-1)" }}>
                {tickerNames[selectedTicker]}
              </span>
            )}
          </div>

          {/* Timestamp list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-2)" }}>
            {tickerReports.map((r) => (
              <div
                key={r.id}
                onClick={() => handleReportClick(r)}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  marginBottom: "var(--space-1)",
                  background: selected?.id === r.id ? "var(--color-bg-elevated)" : "transparent",
                  border: selected?.id === r.id ? "1px solid var(--color-border-accent)" : "1px solid transparent",
                  transition: "all var(--duration-fast) var(--ease-out)",
                }}
              >
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  {formatDate(r.id)}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "var(--space-1)", fontFamily: "var(--font-mono)" }}>
                  {(r.size_bytes / 1024).toFixed(0)} KB
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>
            {reports.length === 0 ? "No reports found" : "Select a report to view"}
          </div>
        ) : (
          <>
            {/* Action bar */}
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-4)",
                borderBottom: "1px solid var(--color-border-subtle)",
                alignItems: "center",
                background: "var(--color-bg-surface)",
              }}
            >
              <span style={{ fontWeight: "var(--weight-bold)", fontSize: "var(--text-md)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{selected.ticker}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{formatDate(selected.id)}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowDebate(false)} className={`btn btn-sm ${!showDebate ? "btn-primary" : "btn-ghost"}`}>
                Report
              </button>
              <button onClick={() => setShowDebate(true)} className={`btn btn-sm ${showDebate ? "btn-primary" : "btn-ghost"}`}>
                Debate Log
              </button>
              <button onClick={handleCheckUrls} disabled={checkingUrls} className="btn btn-sm btn-secondary">
                {checkingUrls ? "Checking..." : "Check URLs"}
              </button>
              <button onClick={handleDelete} className="btn btn-sm btn-ghost" style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}>
                Delete
              </button>
            </div>

            {/* Content area */}
            {showDebate ? (
              <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-5) var(--space-6)" }}>
                <DebateTranscript debate={debate} />
              </div>
            ) : (
              <>
                {urlChecks.length > 0 && (
                  <div style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--color-border-subtle)" }}>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)", color: "var(--color-text-primary)" }}>URL Verification</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                      {urlChecks.map((uc) => (
                        <div key={uc.url} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)" }}>
                          <FactCheckBadge url={uc.url} status={uc.status as FactCheckStatus} />
                          <span style={{ color: "var(--color-text-secondary)", wordBreak: "break-all" }}>{uc.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary && (
                  <div style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-bg-surface)" }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>Summary</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)" }}>{summary}</div>
                  </div>
                )}

                {loading ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                    Loading...
                  </div>
                ) : (
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <ReportReader content={content} onExport={handleExport} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DebateTranscript({ debate }: { debate: Transcript | null }) {
  if (!debate) {
    return <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No debate transcript available.</div>;
  }
  const sections = [
    { key: "bull" as const, label: "Bull Case", color: "var(--color-success)", icon: "↑" },
    { key: "bear" as const, label: "Bear Case", color: "var(--color-error)", icon: "↓" },
    { key: "risk" as const, label: "Risk Analysis", color: "var(--color-warning)", icon: "!" },
    { key: "neutral" as const, label: "Neutral", color: "var(--color-text-muted)", icon: "→" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {sections.map(({ key, label, color, icon }) => {
        const entries = debate[key];
        if (!entries || entries.length === 0) return null;
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <span style={{ width: 20, height: 20, borderRadius: "var(--radius-sm)", background: `color-mix(in oklch, ${color} 15%, transparent)`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", fontWeight: "var(--weight-bold)" }}>{icon}</span>
              <span style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-md)", color: "var(--color-text-primary)" }}>{label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {entries.map((entry, i) => (
                <div key={i} style={{ padding: "var(--space-3)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)" }}>
                  {entry.speaker && (
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-accent)", marginBottom: "var(--space-1)" }}>{entry.speaker}</div>
                  )}
                  <div style={{ fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!debate.bull?.length && !debate.bear?.length && !debate.risk?.length && !debate.neutral?.length && (
        <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No structured debate sections found.</div>
      )}
    </div>
  );
}
