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
    <div className="flex h-full">
      {/* ── Sidebar ── */}
      <div className="w-[280px] min-w-[280px] border-r border-c-border-subtle flex flex-col bg-c-bg-surface relative overflow-hidden">
        {/* Header */}
        <div className="panel-header">
          <span className="panel-title">Reports</span>
          <span className="badge bg-c-bg-elevated text-c-text-muted">
            {reports.length}
          </span>
        </div>

        <div className="p-2 border-b border-c-border-subtle flex-shrink-0">
          <input
            type="text"
            placeholder="Search ticker..."
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            className="input w-full text-sm py-1 px-2"
          />
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* ── Layer 1: Ticker list ── */}
          <div
            className="absolute inset-0 flex flex-col"
            style={{
              opacity: showTimestamps ? 0 : 1,
              transform: showTimestamps ? "translateX(-20px)" : "translateX(0)",
              transition: "opacity var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)",
              pointerEvents: showTimestamps ? "none" : "auto",
            }}
          >
          <div className="flex-1 overflow-y-auto p-2">
            {sortedTickers.map((ticker) => {
              const reports_for_ticker = tickerGroups[ticker] ?? [];
              const companyName = tickerNames[ticker];
              return (
                <div
                  key={ticker}
                  onClick={() => handleTickerClick(ticker)}
                  className="py-2 px-3 rounded-md cursor-pointer mb-1 transition-colors duration-fast hover:bg-c-bg-hover"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-md text-c-text-primary font-mono">
                      {ticker}
                    </span>
                    <span className="badge bg-c-bg-elevated text-c-text-faint text-xs">
                      {reports_for_ticker.length}
                    </span>
                  </div>
                  {companyName && (
                    <div className="text-sm text-c-text-secondary mt-1">
                      {companyName}
                    </div>
                  )}
                </div>
              );
            })}
            {sortedTickers.length === 0 && (
              <div className="text-c-text-muted text-sm p-3">
                No reports found.
              </div>
            )}
          </div>
        </div>

        {/* ── Layer 2: Timestamp list (morphs in) ── */}
        <div
          className="absolute inset-0 flex flex-col"
          style={{
            opacity: showTimestamps ? 1 : 0,
            transform: showTimestamps ? "translateX(0)" : "translateX(20px)",
            transition: "opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out)",
            transitionDelay: showTimestamps ? "150ms" : "0ms",
            pointerEvents: showTimestamps ? "auto" : "none",
          }}
        >
          {/* Back header */}
          <div
            className="flex items-center gap-2 py-2 px-3 border-b border-c-border-subtle cursor-pointer transition-colors duration-fast hover:bg-c-bg-hover"
            onClick={handleBackToTickers}
          >
            <span className="text-c-text-muted text-sm">←</span>
            <span className="font-semibold text-sm text-c-text-primary font-mono">
              {selectedTicker}
            </span>
            {selectedTicker && tickerNames[selectedTicker] && (
              <span className="text-xs text-c-text-faint ml-1">
                {tickerNames[selectedTicker]}
              </span>
            )}
          </div>

          {/* Timestamp list */}
          <div className="flex-1 overflow-y-auto p-2">
            {tickerReports.map((r) => (
              <div
                key={r.id}
                onClick={() => handleReportClick(r)}
                className="py-2 px-3 rounded-md cursor-pointer mb-1 transition-all duration-fast"
                style={{
                  background: selected?.id === r.id ? "var(--color-bg-elevated)" : "transparent",
                  border: selected?.id === r.id ? "1px solid var(--color-border-accent)" : "1px solid transparent",
                }}
              >
                <div className="text-sm text-c-text-primary">
                  {formatDate(r.id)}
                </div>
                <div className="text-xs text-c-text-faint mt-1 font-mono">
                  {(r.size_bytes / 1024).toFixed(0)} KB
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-c-text-faint text-sm">
            {reports.length === 0 ? "No reports found" : "Select a report to view"}
          </div>
        ) : (
          <>
            {/* Action bar */}
            <div className="flex gap-2 py-2 px-4 border-b border-c-border-subtle items-center bg-c-bg-surface">
              <span className="font-bold text-md text-c-text-primary font-mono">{selected.ticker}</span>
              <span className="text-xs text-c-text-faint">{formatDate(selected.id)}</span>
              {selectedFile && (
                <>
                  <span className="text-c-text-muted mx-1">/</span>
                  <span className="text-sm text-c-text-secondary">{selectedFile.name}</span>
                </>
              )}
              <div className="flex-1" />
              <Button variant="secondary" size="sm" onClick={handleCheckUrls} disabled={checkingUrls}>
                {checkingUrls ? "Checking..." : "Check URLs"}
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>

            {/* Content area */}
            {urlChecks.length > 0 && (
              <div className="py-3 px-4 border-b border-c-border-subtle">
                <div className="text-sm font-semibold mb-2 text-c-text-primary">URL Verification</div>
                <div className="flex flex-col gap-1">
                  {urlChecks.map((uc) => (
                    <div key={uc.url} className="flex items-center gap-2 text-xs">
                      <FactCheckBadge url={uc.url} status={uc.status as FactCheckStatus} />
                      <span className="text-c-text-secondary break-all">{uc.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-c-text-muted text-sm">
                Loading...
              </div>
            ) : selectedFile ? (
              <div className="flex-1 overflow-hidden">
                <ReportReader
                  content={content}
                  onExport={handleExport}
                  fileTree={fileTree}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-c-text-faint text-sm">
                Select a report to view
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
