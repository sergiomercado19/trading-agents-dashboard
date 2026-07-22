import { TrendingUp, TrendingDown, AlertTriangle, Scale, type LucideIcon } from "lucide-react";

interface Transcript {
  bull: Array<{ speaker: string; text: string }>;
  bear: Array<{ speaker: string; text: string }>;
  risk: Array<{ speaker: string; text: string }>;
  neutral: Array<{ speaker: string; text: string }>;
}

type TranscriptKey = keyof Transcript;

interface Props {
  transcript: Transcript | null;
}

const SECTION_CONFIG: Record<TranscriptKey, { icon: LucideIcon; color: string; label: string }> = {
  bull: { icon: TrendingUp, color: "var(--success)", label: "Bull Case" },
  bear: { icon: TrendingDown, color: "var(--error)", label: "Bear Case" },
  risk: { icon: AlertTriangle, color: "var(--warning)", label: "Risk Assessment" },
  neutral: { icon: Scale, color: "var(--accent)", label: "Final Decision" },
};

export default function DebateTranscript({ transcript }: Props) {
  if (!transcript) {
    return (
      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13 }}>
        No debate transcript available.
      </div>
    );
  }

  const sections = (Object.keys(SECTION_CONFIG) as TranscriptKey[]).filter(
    (key) => transcript[key]?.length > 0,
  );

  if (sections.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13 }}>
        Debate transcript empty.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sections.map((key) => {
        const config = SECTION_CONFIG[key];
        const Icon = config.icon;
        return (
          <div key={key}>
            <h4 style={{ fontSize: 14, color: config.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon size={14} /> {config.label}
            </h4>
            {transcript[key].map((entry: { speaker: string; text: string }, i: number) => (
              <div
                key={i}
                style={{
                  padding: "8px 12px",
                  background: "var(--bg-tertiary)",
                  borderRadius: 6,
                  marginBottom: 6,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {entry.text}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
