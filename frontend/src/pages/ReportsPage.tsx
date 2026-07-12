import { useState, useEffect } from "react";
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

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selected, setSelected] = useState<ReportMeta | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDebate, setShowDebate] = useState(false);
  const [urlChecks, setUrlChecks] = useState<UrlCheck[]>([]);
  const [checkingUrls, setCheckingUrls] = useState(false);

  const { transcript: debate } = useDebateTranscript(selected?.id || null);
  const { summary } = useSummary(selected?.id || null);

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
      {/* Report list sidebar */}
      <div
        style={{
          width: 280,
          minWidth: 280,
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ padding: "12px 12px 8px", fontWeight: 600, fontSize: 15 }}>
          Reports ({reports.length})
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {reports.map((r) => (
            <div
              key={r.id}
              onClick={() => { setSelected(r); setShowDebate(false); }}
              style={{
                padding: "10px 10px",
                borderRadius: 6,
                cursor: "pointer",
                marginBottom: 4,
                background: selected?.id === r.id ? "var(--bg-tertiary)" : "transparent",
                border: selected?.id === r.id ? "1px solid var(--accent)" : "1px solid transparent",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.ticker}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {r.date.replace(/_/g, " ").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {(r.size_bytes / 1024).toFixed(0)} KB
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 12 }}>
              No reports found.
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            Select a report to view
          </div>
        ) : (
          <>
            {/* Action bar */}
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                background: "var(--bg-secondary)",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 15 }}>{selected.ticker}</span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setShowDebate(false)}
                style={{
                  background: !showDebate ? "var(--accent)" : "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: !showDebate ? "#000" : "var(--text-primary)",
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Report
              </button>
              <button
                onClick={() => setShowDebate(true)}
                style={{
                  background: showDebate ? "var(--accent)" : "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: showDebate ? "#000" : "var(--text-primary)",
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Debate Log
              </button>
              <button
                onClick={handleCheckUrls}
                disabled={checkingUrls}
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--text-primary)",
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {checkingUrls ? "Checking..." : "Check URLs"}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: "transparent",
                  border: "1px solid var(--danger)",
                  borderRadius: 4,
                  color: "var(--danger)",
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Delete
              </button>
            </div>

            {/* Content area */}
            {showDebate ? (
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
                <DebateTranscript debate={debate} />
              </div>
            ) : (
              <>
                {/* URL checks */}
                {urlChecks.length > 0 && (
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>URL Verification Results</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {urlChecks.map((uc) => (
                        <div key={uc.url} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <FactCheckBadge url={uc.url} status={uc.status as FactCheckStatus} />
                          <span style={{ color: "var(--text-secondary)", wordBreak: "break-all" }}>{uc.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {summary && (
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Summary</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{summary}</div>
                  </div>
                )}

                {/* Report reader */}
                {loading ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
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
    return <div style={{ color: "var(--text-muted)" }}>No debate transcript available.</div>;
  }
  const sections = [
    { key: "bull" as const, label: "Bull Case", color: "var(--accent)" },
    { key: "bear" as const, label: "Bear Case", color: "var(--danger)" },
    { key: "risk" as const, label: "Risk Analysis", color: "var(--warning)" },
    { key: "neutral" as const, label: "Neutral", color: "var(--text-muted)" },
  ];
  return (
    <div>
      {sections.map(({ key, label, color }) => {
        const entries = debate[key];
        if (!entries || entries.length === 0) return null;
        return (
          <div key={key} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color, marginBottom: 6, fontSize: 14 }}>{label}</div>
            {entries.map((entry, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                {entry.speaker && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{entry.speaker}</div>
                )}
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {!debate.bull?.length && !debate.bear?.length && !debate.risk?.length && !debate.neutral?.length && (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No structured debate sections found.</div>
      )}
    </div>
  );
}
