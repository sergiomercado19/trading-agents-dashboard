import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ControlPanel from "../components/ControlPanel/ControlPanel";
import MessageFeed from "../components/MessageFeed/MessageFeed";
import StatsDrawer from "../components/StatsDrawer";
import { useRunStream } from "../hooks/useRunStream";
import { useRuns } from "../hooks/useRuns";
import { useCostEstimate } from "../hooks/useCostEstimate";
import { fetchJson } from "../api/client";

// Cookie helpers
function getSettingFromCookie(name: string): string | undefined {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      return value;
    }
  }
  return undefined;
}

function setSettingInCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
}

// Safer parsing for JSON values from cookies
function parseJsonFromCookie<T>(cookieValue: string | undefined, defaultValue: T): T {
  if (cookieValue === undefined) return defaultValue;
  try {
    return JSON.parse(cookieValue) as T;
  } catch (e) {
    return defaultValue;
  }
}

// State initialization from cookies
export default function AnalyzePage() {
  const navigate = useNavigate();
  const [ticker, setTicker] = useState<string>(() => {
    const cookieVal = getSettingFromCookie('analyze_ticker');
    return cookieVal || "";
  });
  const [date, setDate] = useState<string>(() => {
    const cookieVal = getSettingFromCookie('analyze_date');
    return cookieVal || new Date().toISOString().split('T')[0] || "";
  });
  const [analysts, setAnalysts] = useState<string[]>(() => {
    const defaultAnalysts = ["market", "social", "news", "fundamentals"];
    return parseJsonFromCookie(getSettingFromCookie('analyze_analysts'), defaultAnalysts);
  });
  const [depth, setDepth] = useState<number>(() => {
    const cookieVal = getSettingFromCookie('analyze_depth');
    return cookieVal ? parseInt(cookieVal) || 3 : 3;
  });
  const [provider, setProvider] = useState<string>(() => {
    const cookieVal = getSettingFromCookie('analyze_provider');
    return cookieVal || 'nvidia';
  });
  const [quickModel, setQuickModel] = useState<string>(() => {
    const cookieVal = getSettingFromCookie('analyze_quick_model');
    return cookieVal || 'nvidia/nemotron-3-nano-30b-a3b';
  });
  const [deepModel, setDeepModel] = useState<string>(() => {
    const cookieVal = getSettingFromCookie('analyze_deep_model');
    return cookieVal || 'nvidia/nemotron-3-ultra-550b-a55b';
  });

  // Fetch models and reset selection when provider changes
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await fetchJson<Record<string, { quick: string[]; deep: string[] }>>("/models");
        const providerModels = models[provider];
        if (providerModels) {
          const quickModels = providerModels.quick || [];
          const deepModels = providerModels.deep || [];
          if (quickModels.length > 0 && !quickModels.includes(quickModel)) {
            setQuickModel(quickModels[0]);
          }
          if (deepModels.length > 0 && !deepModels.includes(deepModel)) {
            setDeepModel(deepModels[0]);
          }
        }
      } catch (e) {
        // Ignore fetch errors
      }
    };
    fetchModels();
  }, [provider]);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { start, stop } = useRuns();

  // State persistence when analysis runs
  useEffect(() => {
    if (activeRunId) {
      setSettingInCookie('analyze_ticker', ticker);
      setSettingInCookie('analyze_date', date);
      setSettingInCookie('analyze_analysts', JSON.stringify(analysts));
      setSettingInCookie('analyze_depth', String(depth));
      setSettingInCookie('analyze_provider', provider);
      setSettingInCookie('analyze_quick_model', quickModel);
      setSettingInCookie('analyze_deep_model', deepModel);
    }
  }, [activeRunId, ticker, date, analysts, depth, provider, quickModel, deepModel]);
  
  const { snapshot, agents, messages, stats, done, error } = useRunStream(activeRunId);
  const { estimate, loading: estimateLoading } = useCostEstimate({
    ticker,
    date,
    analysts,
    research_depth: depth,
    provider,
    quick_model: quickModel,
    deep_model: deepModel,
  });

  const running = snapshot?.status === "running";

  useEffect(() => {
    if (!running || !startTime) {
      return;
    }
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [running, startTime]);

  useEffect(() => {
    if (done || error) {
      setStartTime(null);
    }
  }, [done, error]);

  // Redirect to reports page when analysis completes
  useEffect(() => {
    if (!done || !activeRunId) return;

    const redirectToReport = async () => {
      try {
        const reports = await fetchJson<{ id: string; ticker: string; modified: number }[]>("/reports");
        // Find the most recent report for this ticker
        const tickerReports = reports
          .filter((r) => r.ticker.toUpperCase() === ticker.toUpperCase())
          .sort((a, b) => b.modified - a.modified);

        if (tickerReports.length > 0) {
          const latest = tickerReports[0]!;
          const timestamp = latest.id.replace(/^[^_]+_/, "");
          navigate(`/reports/${latest.ticker}/${timestamp}`);
        } else {
          // Fallback to reports page if no report found
          navigate("/reports");
        }
      } catch {
        navigate("/reports");
      }
    };

    redirectToReport();
  }, [done, activeRunId, ticker, navigate]);

  const handleStart = async () => {
    if (!ticker) return;
    setStartTime(Date.now());
    setElapsedSeconds(0);
    const run = await start({
      ticker,
      date,
      analysts,
      research_depth: depth,
      provider,
      quick_model: quickModel,
      deep_model: deepModel,
    });
    setActiveRunId(run.run_id);
  };

  const handleStop = async () => {
    if (activeRunId) {
      await stop(activeRunId);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Stats toggle button */}
      <button
        onClick={() => setStatsOpen(true)}
        className="btn btn-ghost btn-sm"
        style={{
          position: "absolute",
          top: "var(--space-3)",
          right: "var(--space-3)",
          zIndex: "var(--z-elevated)",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)" }}>◇</span>
        Stats
      </button>

      {/* Terminal grid: 2 panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "var(--space-3)",
          padding: "var(--space-3)",
          height: "100%",
          minHeight: 0,
        }}
      >
        {/* Panel 1: Control / Pipeline */}
        <div style={{ minHeight: 0 }}>
          <ControlPanel
            running={running}
            snapshot={snapshot}
            agents={agents}
            estimate={estimate}
            estimateLoading={estimateLoading}
            ticker={ticker}
            date={date}
            analysts={analysts}
            depth={depth}
            provider={provider}
            quickModel={quickModel}
            deepModel={deepModel}
            stats={stats}
            elapsedSeconds={elapsedSeconds}
            onStart={handleStart}
            onStop={handleStop}
            onTickerChange={setTicker}
            onDateChange={setDate}
            onAnalystsChange={setAnalysts}
            onDepthChange={setDepth}
            onProviderChange={setProvider}
            onQuickModelChange={setQuickModel}
            onDeepModelChange={setDeepModel}
          />
        </div>

        {/* Panel 2: Message Feed */}
        <div style={{ minHeight: 0 }}>
          <MessageFeed messages={messages} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "var(--space-4)",
            left: "var(--space-4)",
            right: "var(--space-4)",
            padding: "var(--space-3) var(--space-4)",
            background: "var(--color-error-subtle)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            fontSize: "var(--text-sm)",
            zIndex: "var(--z-elevated)",
          }}
        >
          {error}
        </div>
      )}

      {/* Stats drawer */}
      <StatsDrawer
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        estimate={estimate}
        snapshot={snapshot}
        done={done}
      />
    </div>
  );
}
