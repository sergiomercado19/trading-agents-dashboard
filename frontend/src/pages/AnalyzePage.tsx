export default function AnalyzePage() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Analyze</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Run multi-agent analysis on a stock ticker.
      </p>
      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--bg-secondary)",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Form, pipeline visualization, and SSE feed will be implemented in Milestone 2.
        </p>
      </div>
    </div>
  );
}
