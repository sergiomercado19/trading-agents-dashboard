export type AnalysisStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "stale";
export type AgentStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type AgentPhase = "data_analysis" | "research" | "trading" | "risk" | "portfolio";

export interface AnalysisListItem {
  id: number;
  ticker: string;
  status: AnalysisStatus;
  final_recommendation: string | null;
  confidence_score: number | null;
  risk_score: number | null;
  current_phase: string | null;
  progress: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentResult {
  id: number;
  name: string;
  phase: AgentPhase | string;
  status: AgentStatus;
  provider: string | null;
  model: string | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  tokens_used: number;
  duration_ms: number;
}

export interface AnalysisDetail extends AnalysisListItem {
  error_message: string | null;
  config_snapshot: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  agents: AgentResult[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
