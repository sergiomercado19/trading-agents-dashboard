import { useState } from "react";

const FREQUENCIES = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const TIMEZONES = [
  "UTC", "US/Eastern", "US/Central", "US/Pacific", "Europe/London",
  "Europe/Berlin", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland",
];

const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

interface Props {
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

export default function SchedulerForm({ onSubmit, onCancel }: Props) {
  const [ticker, setTicker] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [timezone, setTimezone] = useState("UTC");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const toggleDay = (d: string) => {
    setDaysOfWeek((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleSubmit = () => {
    if (!ticker) return;
    const data: Record<string, unknown> = {
      ticker: ticker.toUpperCase(),
      frequency,
      hour,
      minute,
      timezone,
      research_depth: 3,
      provider: "openai",
    };
    if (frequency === "weekly") data.days_of_week = daysOfWeek;
    if (frequency === "monthly") data.day_of_month = dayOfMonth;
    onSubmit(data);
  };

  const previewNextRun = () => {
    if (frequency === "hourly") return `Every hour at :${String(minute).padStart(2, "0")}`;
    if (frequency === "daily") return `Daily at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${timezone}`;
    if (frequency === "weekly") return `Weekly on ${daysOfWeek.join(", ")} at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${timezone}`;
    if (frequency === "monthly") return `Monthly on day ${dayOfMonth} at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${timezone}`;
    return "";
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: 13,
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Ticker</label>
        <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" style={inputStyle} />
      </div>

      <div>
        <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Frequency</label>
        <div style={{ display: "flex", gap: 6 }}>
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              onClick={() => setFrequency(f.value)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: frequency === f.value ? "var(--accent)" : "var(--bg-tertiary)",
                color: frequency === f.value ? "#fff" : "var(--text-muted)",
                border: `1px solid ${frequency === f.value ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {frequency !== "hourly" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Hour</label>
            <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(+e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Minute</label>
            <input type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(+e.target.value)} style={inputStyle} />
          </div>
        </div>
      )}

      {frequency === "hourly" && (
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Minute</label>
          <input type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(+e.target.value)} style={{ ...inputStyle, width: 120 }} />
        </div>
      )}

      {frequency === "weekly" && (
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Days of Week</label>
          <div style={{ display: "flex", gap: 4 }}>
            {DAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => toggleDay(d.value)}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  background: daysOfWeek.includes(d.value) ? "var(--accent)" : "var(--bg-tertiary)",
                  color: daysOfWeek.includes(d.value) ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${daysOfWeek.includes(d.value) ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {frequency === "monthly" && (
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Day of Month</label>
          <input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(+e.target.value)} style={{ ...inputStyle, width: 120 }} />
        </div>
      )}

      <div>
        <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Timezone</label>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={inputStyle}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div style={{ padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: 6, fontSize: 12, color: "var(--text-muted)" }}>
        Preview: {previewNextRun()}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={!ticker}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            background: ticker ? "var(--accent)" : "var(--bg-tertiary)",
            color: ticker ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: 6,
            cursor: ticker ? "pointer" : "not-allowed",
          }}
        >
          Create Job
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "10px 16px",
            fontSize: 14,
            background: "var(--bg-tertiary)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
