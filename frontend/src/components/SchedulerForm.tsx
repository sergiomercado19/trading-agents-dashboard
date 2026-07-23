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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs text-c-text-muted mb-1">Ticker</label>
        <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" className="input" />
      </div>

      <div>
        <label className="block text-xs text-c-text-muted mb-1">Frequency</label>
        <div className="flex gap-1.5">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              onClick={() => setFrequency(f.value)}
              className={`px-3 py-1.5 text-xs rounded border cursor-pointer transition-colors ${
                frequency === f.value
                  ? "bg-c-accent text-white border-c-accent"
                  : "bg-c-bg-elevated text-c-text-muted border-c-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {frequency !== "hourly" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-c-text-muted mb-1">Hour</label>
            <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(+e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs text-c-text-muted mb-1">Minute</label>
            <input type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(+e.target.value)} className="input" />
          </div>
        </div>
      )}

      {frequency === "hourly" && (
        <div>
          <label className="block text-xs text-c-text-muted mb-1">Minute</label>
          <input type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(+e.target.value)} className="input w-[120px]" />
        </div>
      )}

      {frequency === "weekly" && (
        <div>
          <label className="block text-xs text-c-text-muted mb-1.5">Days of Week</label>
          <div className="flex gap-1">
            {DAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => toggleDay(d.value)}
                className={`px-2.5 py-1 text-xs rounded border cursor-pointer transition-colors ${
                  daysOfWeek.includes(d.value)
                    ? "bg-c-accent text-white border-c-accent"
                    : "bg-c-bg-elevated text-c-text-muted border-c-border"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {frequency === "monthly" && (
        <div>
          <label className="block text-xs text-c-text-muted mb-1">Day of Month</label>
          <input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(+e.target.value)} className="input w-[120px]" />
        </div>
      )}

      <div>
        <label className="block text-xs text-c-text-muted mb-1">Timezone</label>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input">
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div className="py-2 px-3 bg-c-bg-elevated rounded-md text-xs text-c-text-muted">
        Preview: {previewNextRun()}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!ticker}
          className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md border-none cursor-pointer transition-colors ${
            ticker
              ? "bg-c-accent text-white cursor-pointer"
              : "bg-c-bg-elevated text-c-text-muted cursor-not-allowed"
          }`}
        >
          Create Job
        </button>
        <button
          onClick={onCancel}
          className="py-2.5 px-4 text-sm bg-c-bg-elevated text-c-text-muted border border-c-border rounded-md cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
