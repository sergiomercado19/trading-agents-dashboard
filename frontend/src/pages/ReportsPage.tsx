import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchJson } from "../api/client";
import { Button } from "@/components/ui/button";
import ReportReader from "../components/ReportReader/ReportReader";
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

interface ReportFile {
  name: string;
  path: string;
}

interface ReportSection {
  label: string;
  path: string;
  files: ReportFile[];
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
  const location = useLocation();
  const navigate = useNavigate();

  // Parse path segments from /reports/* wildcard
  const pathSegments = location.pathname.replace(/^\/reports\/?/, "").split("/").filter(Boolean);
  const urlTicker = pathSegments[0] || null;
  const urlTimestamp = pathSegments[1] || null;

  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selected, setSelected] = useState<ReportMeta | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlChecks, setUrlChecks] = useState<UrlCheck[]>([]);
  const [checkingUrls, setCheckingUrls] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [tickerNames, setTickerNames] = useState<Record<string, string>>({});
  const [tickerFilter, setTickerFilter] = useState("");
  const [fileTree, setFileTree] = useState<ReportSection[]>([]);
  const [selectedFile, setSelectedFile] = useState<ReportFile | null>(null);
  const urlSynced = useRef(false);

  useEffect(() => {
    fetchJson<Record<string, string>>("/ticker/names").then(setTickerNames).catch(() => {});
  }, []);

  useEffect(() => {
    fetchJson<ReportMeta[]>("/reports").then(setReports).catch(() => {});
  }, []);

  // Sync URL params to state on initial load only
  useEffect(() => {
    if (urlSynced.current) return;
    if (!urlTicker || reports.length === 0) return;
    urlSynced.current = true;
    setSelectedTicker(urlTicker);
    setShowTimestamps(true);
    if (urlTimestamp) {
      // Match against id which is TICKER_timestamp
      const match = reports.find((r) => r.ticker === urlTicker && r.id.endsWith(urlTimestamp));
      if (match) {
        setSelected(match);
      }
    }
  }, [reports, urlTicker, urlTimestamp]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setSelectedFile(null);
    setContent("");
    fetchJson<ReportSection[]>(`/reports/tree?path=${encodeURIComponent(selected.path)}`)
      .then((sections) => {
        setFileTree(sections);
        // Default to complete_report.md if available
        const completeSection = sections.find(s => s.label === "Complete Report");
        if (completeSection?.files[0]) {
          setSelectedFile(completeSection.files[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selected]);

  useEffect(() => {
    if (!selectedFile) return;
    setLoading(true);
    fetchJson<{ path: string; content: string }>(`/reports/read?path=${encodeURIComponent(selectedFile.path)}`)
      .then((d) => { setContent(d.content || ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedFile]);

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

  const sortedTickers = useMemo(() => {
    const all = Object.keys(tickerGroups).sort();
    if (!tickerFilter) return all;
    const q = tickerFilter.toUpperCase();
    return all.filter((t) => t === q || (tickerNames[t] ?? "").toUpperCase() === q);
  }, [tickerGroups, tickerNames, tickerFilter]);

  const tickerReports = selectedTicker ? tickerGroups[selectedTicker] || [] : [];

  const handleTickerClick = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
    setShowTimestamps(true);
  }, []);

  const handleBackToTickers = useCallback(() => {
    setShowTimestamps(false);
    setSelectedTicker(null);
    setSelected(null);
    setFileTree([]);
    setSelectedFile(null);
  }, []);

  const handleReportClick = useCallback((report: ReportMeta) => {
    if (selected?.id === report.id) return;
    setSelected(report);
    setFileTree([]);
    setSelectedFile(null);
  }, [selected]);

  // Sync state → URL (single source of truth for navigation)
  useEffect(() => {
    if (!showTimestamps || !selectedTicker) {
      navigate("/reports", { replace: true });
    } else if (selected) {
      const timestamp = selected.id.replace(/^[^_]+_/, '');
      navigate(`/reports/${selectedTicker}/${timestamp}`, { replace: true });
    } else {
      navigate(`/reports/${selectedTicker}`, { replace: true });
    }
  }, [showTimestamps, selectedTicker, selected, navigate]);

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
          <span className="badge bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
            {reports.length}
          </span>
        </div>

        <div style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border-subtle)", flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Search ticker..."
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            className="input"
            style={{ width: "100%", fontSize: "var(--text-sm)", padding: "var(--space-1) var(--space-2)" }}
          />
        </div>

        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          {/* ── Layer 1: Ticker list ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
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
                    <span className="badge bg-[var(--color-bg-elevated)] text-[var(--color-text-faint)] text-xs">
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
            inset: 0,
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
              {selectedFile && (
                <>
                  <span style={{ color: "var(--color-text-muted)", margin: "0 var(--space-1)" }}>/</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{selectedFile.name}</span>
                </>
              )}
              <div style={{ flex: 1 }} />
              <Button variant="secondary" size="sm" onClick={handleCheckUrls} disabled={checkingUrls}>
                {checkingUrls ? "Checking..." : "Check URLs"}
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>

            {/* Content area */}
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

            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                Loading...
              </div>
            ) : selectedFile ? (
              <div style={{ flex: 1, overflow: "hidden" }}>
                <ReportReader
                  content={content}
                  onExport={handleExport}
                  fileTree={fileTree}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                />
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>
                Select a report to view
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
