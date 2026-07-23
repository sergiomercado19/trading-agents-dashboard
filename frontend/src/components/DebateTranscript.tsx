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
  bull: { icon: TrendingUp, color: "var(--color-success)", label: "Bull Case" },
  bear: { icon: TrendingDown, color: "var(--color-error)", label: "Bear Case" },
  risk: { icon: AlertTriangle, color: "var(--color-warning)", label: "Risk Assessment" },
  neutral: { icon: Scale, color: "var(--color-accent)", label: "Final Decision" },
};

export default function DebateTranscript({ transcript }: Props) {
  if (!transcript) {
    return (
      <div className="p-4 text-[13px] text-c-text-muted">
        No debate transcript available.
      </div>
    );
  }

  const sections = (Object.keys(SECTION_CONFIG) as TranscriptKey[]).filter(
    (key) => transcript[key]?.length > 0,
  );

  if (sections.length === 0) {
    return (
      <div className="p-4 text-[13px] text-c-text-muted">
        Debate transcript empty.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((key) => {
        const config = SECTION_CONFIG[key];
        const Icon = config.icon;
        return (
          <div key={key}>
            <h4 className="text-sm mb-2 flex items-center gap-1.5" style={{ color: config.color }}>
              <Icon size={14} /> {config.label}
            </h4>
            {transcript[key].map((entry: { speaker: string; text: string }, i: number) => (
              <div
                key={i}
                className="py-2 px-3 bg-c-bg-elevated rounded-md mb-1.5 text-[13px] leading-relaxed whitespace-pre-wrap"
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
