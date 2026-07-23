export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-c-bg-root">
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-accent)",
        }}
      />
    </div>
  );
}
