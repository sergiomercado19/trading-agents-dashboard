import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ControlPanel from "../components/ControlPanel/ControlPanel";
import PipelineLayer from "../components/PipelineVisualization";
import MessageFeed from "../components/MessageFeed/MessageFeed";
import ActiveAnalyses from "../components/ActiveAnalyses/ActiveAnalyses";
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
  const { runId } = useParams<{ runId: string }>();
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
            setQuickModel(quickModels[0]!);
          }
          if (deepModels.length > 0 && !deepModels.includes(deepModel)) {
            setDeepModel(deepModels[0]!);
          }
        }
      } catch (e) {
        // Ignore fetch errors
      }
    };
    fetchModels();
  }, [provider]);

  const [activeRunId, setActiveRunId] = useState<string | null>(runId ?? null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { start, stop, runs: allRuns, refresh: refreshRuns, removeFromQueue, loading: runsLoading } = useRuns();

  // Keep activeRunId in sync with the route param
  useEffect(() => {
    setActiveRunId(runId ?? null);
  }, [runId]);

  // Fetch active runs periodically
  useEffect(() => {
    refreshRuns();
    const interval = setInterval(refreshRuns, 5000);
    return () => clearInterval(interval);
  }, [refreshRuns]);

  // All runs for the list (including completed)
  const allRunsList = allRuns.map((r) => ({
    run_id: r.run_id,
    ticker: r.ticker,
    date: r.date,
    status: r.status,
    started: r.started,
  }));

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

  const isActive = snapshot?.status === "running" || snapshot?.status === "queued";

  // Redirect to /analyze when the run id doesn't match an active run
  useEffect(() => {
    if (!runId || runsLoading || done) return;
    const found = allRuns.some(
      (r) => r.run_id === runId && (r.status === "queued" || r.status === "running")
    );
    if (!found) {
      navigate("/analyze", { replace: true });
    }
  }, [runId, allRuns, runsLoading, done, navigate]);

  // Restore startTime from snapshot when mounting an existing run
  useEffect(() => {
    if (snapshot && snapshot.started && !startTime) {
      const snapshotTime = snapshot.started * 1000;
      if (snapshot.status === "running") {
        setStartTime(snapshotTime);
        setElapsedSeconds(Math.floor((Date.now() - snapshotTime) / 1000));
      } else if (["completed", "stopped", "error"].includes(snapshot.status)) {
        setStartTime(null);
        setElapsedSeconds(Math.floor((snapshot.ended ?? Date.now() / 1000) - snapshot.started));
      }
    }
  }, [snapshot]);

  // Morphing state for ControlPanel <-> PipelineLayer transition
  const [showForm, setShowForm] = useState(!isActive);
  const [showPipeline, setShowPipeline] = useState(isActive);

  useEffect(() => {
    if (!isActive) {
      setShowPipeline(false);
      const t = setTimeout(() => setShowForm(true), 50);
      return () => clearTimeout(t);
    }
    setShowForm(false);
    setShowPipeline(true);
    return undefined;
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !startTime) {
      return;
    }
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [isActive, startTime]);

  useEffect(() => {
    if (done || error) {
      setStartTime(null);
    }
  }, [done, error]);

  // Redirect to reports page when analysis completes
  useEffect(() => {
    if (!done || !activeRunId) return;

    // Redirect to ticker reports page when analysis completes
    navigate(`/reports/${ticker.toUpperCase()}`);
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
    navigate(`/analyze/${run.run_id}`);
  };

  const handleStop = async () => {
    if (!activeRunId) return;
    if (snapshot?.status === "queued") {
      await removeFromQueue(activeRunId);
      navigate("/analyze");
    } else {
      await stop(activeRunId);
    }
  };

  const handleSelectRun = useCallback((runId: string) => {
    navigate(`/analyze/${runId}`);
  }, [navigate]);

  const handleStopRun = useCallback(async (runId: string) => {
    await stop(runId);
    if (activeRunId === runId) {
      navigate("/analyze");
    }
  }, [activeRunId, stop, navigate]);

  const handleRemoveFromQueue = useCallback(async (runId: string) => {
    await removeFromQueue(runId);
    if (activeRunId === runId) {
      navigate("/analyze");
    }
  }, [activeRunId, removeFromQueue, navigate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
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
        {/* Panel 1: Control / Pipeline + Active Analyses (stacked vertically) */}
        <div style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* Control/Pipeline morphing container */}
          <div style={{ position: "relative", minHeight: 578, height: "50%" }}>
            {/* Form layer */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: showForm ? 1 : 0,
                transform: showForm ? "translateX(0)" : "translateX(-20px)",
                transition: "opacity var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)",
                pointerEvents: showForm ? "auto" : "none",
              }}
            >
              <ControlPanel
                estimate={estimate}
                estimateLoading={estimateLoading}
                ticker={ticker}
                date={date}
                analysts={analysts}
                depth={depth}
                provider={provider}
                quickModel={quickModel}
                deepModel={deepModel}
                onStart={handleStart}
                onTickerChange={setTicker}
                onDateChange={setDate}
                onAnalystsChange={setAnalysts}
                onDepthChange={setDepth}
                onProviderChange={setProvider}
                onQuickModelChange={setQuickModel}
                onDeepModelChange={setDeepModel}
              />
            </div>

            {/* Pipeline layer (morphs in when running) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: showPipeline ? 1 : 0,
                transform: showPipeline ? "translateX(0)" : "translateX(20px)",
                transition: "opacity var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)",
                transitionDelay: showPipeline ? "150ms" : "0ms",
                pointerEvents: showPipeline ? "auto" : "none",
              }}
            >
              <PipelineLayer
                agents={agents}
                stats={stats}
                elapsedSeconds={elapsedSeconds}
                snapshot={snapshot}
                onStop={handleStop}
              />
            </div>
          </div>

          {/* Active analyses list */}
          <div style={{ height: "50%" }}>
            <ActiveAnalyses
              runs={allRunsList}
              activeRunId={activeRunId}
              onSelectRun={handleSelectRun}
              onStopRun={handleStopRun}
              onRemoveFromQueue={handleRemoveFromQueue}
            />
          </div>
        </div>

        {/* Panel 2: Message Feed */}
        <div style={{ minHeight: 0 }}>
          <MessageFeed messages={messages} status={snapshot?.status} />
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
    </div>
  );
}
