interface LogoProps {
  size?: number;
}

export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: "var(--color-accent)" }}>
      <rect width="32" height="32" rx={size * 0.1875} fill="currentColor" opacity="0.1"/>
      <path d="M8 16L14 22L24 10" stroke="currentColor" strokeWidth={size * 0.078} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface LogoWithTextProps {
  size?: number;
}

export function LogoWithText({ size = 28 }: LogoWithTextProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      <Logo size={size} />
      <span style={{
        fontSize: `calc(${size}px * 0.85)`,
        fontWeight: "var(--weight-bold)",
        color: "var(--color-text-primary)",
        letterSpacing: "-0.02em",
      }}>
        TradingAgents
      </span>
    </div>
  );
}