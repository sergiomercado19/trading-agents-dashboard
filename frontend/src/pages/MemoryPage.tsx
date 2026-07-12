export default function MemoryPage() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Memory / RAG</h2>
      <p style={{ color: "var(--text-muted)" }}>
        ChromaDB memory sync, Obsidian vault integration, similarity search.
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
          Memory/RAG page will be implemented in Milestone 6.
        </p>
      </div>
    </div>
  );
}
