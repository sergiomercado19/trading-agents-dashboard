/**
 * Hooks Index
 * Central exports for all custom hooks
 */

// API & Data
export { useApi } from "./useApi";
export type { UseApiState, UseApiActions, UseApiOptions } from "./useApi";

// Run & Analysis
export { useRuns } from "./useRuns";
export { useCostEstimate, type CostEstimate } from "./useCostEstimate";
export { useRunStream, useRunStreamControl, type RunStreamState, type UseRunStreamResult } from "./useRunStream";
export type { RunSnapshot } from "./useRunStream";
export { runStreamService } from "../services/runStreamService";

// Chat & Memory
export { useChatSessions, useChatSession, type ChatSessionSummary, type ChatSession, type ChatMessage } from "./useChatSessions";
export { useChatStream, type ChatMessageStream } from "./useChatStream";
export { useMemoryStatus, type MemoryStatus } from "./useMemoryStatus";
export { useMemories, type MemoryResult } from "./useMemories";

// Scheduler
export { useSchedulerJobs, type SchedulerJob } from "./useSchedulerJobs";

// Other
export { useDebateTranscript, type DebateTranscript } from "./useDebateTranscript";
export { useSummary, type SummaryResult } from "./useSummary";
export { useTickerSearch, type TickerSuggestion } from "./useTickerSearch";

// Request deduplication
export { useDeduplicatedRequest, createQueryKey, type RequestDeduplicator } from "../utils/requestDeduplication";