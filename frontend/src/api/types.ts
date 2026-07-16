/**
 * Centralized API type definitions
 * All request/response types for the API routes
 */

/**
 * ── Health ──
 */
export interface HealthResponse {
  status: string;
}

export interface DetailedHealthResponse {
  status: 'ok' | 'degraded';
  python: string;
  tradingagents: boolean;
  env_file: boolean;
  required_deps: string[];
  missing_deps: string[];
}

/**
 * ── Docker ──
 */
export interface DockerInfo {
  is_docker: boolean;
  hostname: string;
  env_path: string;
}

/**
 * ── Providers & Models ──
 */
export interface Provider {
  id: string;
  name: string;
}

export interface ModelLists {
  [provider: string]: {
    quick: string[];
    deep: string[];
  };
}

/**
 * ── Presets ──
 */
export interface Preset {
  id: string;
  name: string;
  config: Record<string, unknown>;
}

/**
 * ── Runs / Analysis ──
 */
export interface RunSnapshot {
  run_id: string;
  ticker: string;
  date: string;
  status: 'queued' | 'running' | 'completed' | 'stopped' | 'error';
  started: number;
  ended: number | null;
  error: string | null;
  decision: string | null;
  agents: Record<string, string>;
  reports: Record<string, string>;
  stats: RunStats;
}

export interface RunStats {
  llm_calls: number;
  tool_calls: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  elapsed_s: number;
}

export interface RunStartParams {
  ticker: string;
  date: string;
  analysts: string[];
  research_depth: number;
  provider: string;
  quick_model: string;
  deep_model: string;
}

export interface RunStartResponse {
  run_id: string;
}

export interface TestKeyResponse {
  valid: boolean;
  message: string;
}

/**
 * ── Environment / Config ──
 */
export interface EnvData {
  [key: string]: string;
}

export interface DataVendorsResponse {
  [key: string]: string | string[];
}

/**
 * ── Reports ──
 */
export interface ReportMeta {
  id: string;
  ticker: string;
  date: string;
  path: string;
  size_bytes: number;
  modified: number;
}

export interface ReportSection {
  label: string;
  path: string;
  files: ReportFile[];
}

export interface ReportFile {
  name: string;
  path: string;
}

/**
 * ── Cost Estimate ──
 */
export interface CostEstimate {
  estimated_tokens_in: number;
  estimated_tokens_out: number;
  estimated_cost_usd: number;
  stages: string[];
  quick_model_price: { input: number; output: number };
  deep_model_price: { input: number; output: number };
  provider: string;
}

/**
 * ── API Keys ──
 */
export interface TestKeyRequest {
  provider: string;
  key: string;
  env_key: string;
}

export interface KeyTestResult {
  valid: boolean;
  message: string;
}

/**
 * ── Install ──
 */
export interface InstallResult {
  success: boolean;
  installed: string[];
  errors: string[];
}

/**
 * ── Chat ──
 */
export interface ChatSessionSummary {
  id: string;
  title: string;
  model: string;
  pinned_reports: string[];
  created_at: number;
  updated_at: number;
  message_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  pinned_reports: string[];
  messages: ChatMessage[];
  created_at: number;
  updated_at: number;
}

export type ChatMessageStream =
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

/**
 * ── Scheduler ──
 */
export interface SchedulerJob {
  job_id: string;
  ticker: string;
  cron: string;
  status: string;
  last_run: number | null;
  run_id: string | null;
  error: string | null;
  created_at: number;
  updated_at: number;
}

export interface SchedulerJobCreate {
  ticker: string;
  cron: string;
  analysts: string[];
  research_depth: number;
  provider: string;
  quick_model: string;
  deep_model: string;
}

/**
 * ── History ──
 */
export interface HistoryStats {
  total_runs: number;
  completed: number;
  failed: number;
  running: number;
  total_cost_usd: number;
  total_tokens: number;
  runs_by_date: Record<string, number>;
  cost_by_date: Record<string, number>;
  ticker_counts: Record<string, number>;
}

export interface RunRecord {
  run_id: string;
  ticker: string;
  date: string;
  status: string;
  started: number;
  ended: number | null;
  error: string | null;
  stats: {
    cost_usd: number;
    tokens_in: number;
    tokens_out: number;
    elapsed_s: number;
  };
}

export interface SchedulerAudit {
  job_id: string;
  ticker: string;
  status: string;
  last_run: number | null;
  run_id: string | null;
  error: string | null;
}

/**
 * ── Memory ──
 */
export interface MemoryStatus {
  status: string;
  python: string;
  chroma: boolean;
  vault_path: string;
  is_docker: boolean;
  collection_count: number;
}

export interface MemorySearchResult {
  id: string;
  document: string;
  metadata: Record<string, unknown>;
  distance: number | null;
}

/**
 * ── Sync ──
 */
export interface SyncResult {
  status: string;
  indexed?: number;
  message?: string;
}

/**
 * ── Ticker Names ──
 */
export interface TickerNamesResponse {
  [ticker: string]: string;
}