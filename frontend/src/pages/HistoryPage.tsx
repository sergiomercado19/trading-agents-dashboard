export default function HistoryPage() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>History</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Usage stats, charts, memory log, scheduler audit trail.
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
          History page will be implemented in Milestone 8.
        </p>
      </div>
    </div>
  );
}
