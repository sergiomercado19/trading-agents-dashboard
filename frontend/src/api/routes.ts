/**
 * Centralized API Routes
 * All endpoints defined with typed parameters and responses
 * Import from '@/api/routes' in hooks and components
 */

import type {
  HealthResponse,
  DetailedHealthResponse,
  Provider,
  ModelLists,
  Preset,
  RunSnapshot,
  RunStartResponse,
  EnvData,
  DataVendorsResponse,
  ReportMeta,
  ReportSection,
  CostEstimate,
  InstallResult,
  SyncResult,
  ChatSessionSummary,
  ChatSession,
  ChatMessageStream,
  SchedulerJob,
  HistoryStats,
  RunRecord,
  SchedulerAudit,
  MemoryStatus,
  MemorySearchResult,
  DockerInfo,
  TestKeyResponse,
} from './types';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface Route<TParams = Record<string, string>, TResponse = unknown> {
  method: HttpMethod;
  path: string;
  params?: TParams;
  response: TResponse;
}

export function buildPath(template: string, params: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (_, key) => String(params[key] ?? ''));
}

export const healthRoutes = {
  basic: {
    method: 'GET' as const,
    path: '/health',
    response: {} as HealthResponse,
  },
  detailed: {
    method: 'GET' as const,
    path: '/health/detailed',
    response: {} as DetailedHealthResponse,
  },
  dockerInfo: {
    method: 'GET' as const,
    path: '/docker/info',
    response: {} as DockerInfo,
  },
} as const;

export const providerRoutes = {
  list: {
    method: 'GET' as const,
    path: '/providers',
    response: {} as Provider[],
  },
  models: {
    method: 'GET' as const,
    path: '/models',
    response: {} as ModelLists,
  },
} as const;

export const presetRoutes = {
  list: {
    method: 'GET' as const,
    path: '/presets',
    response: {} as Preset[],
  },
  create: {
    method: 'POST' as const,
    path: '/presets',
    response: {} as Preset,
  },
  delete: (id: string) => ({
    method: 'DELETE' as const,
    path: `/presets/${id}`,
    response: undefined as void,
  }),
} as const;

export const analyzeRoutes = {
  start: {
    method: 'POST' as const,
    path: '/analyze',
    response: {} as RunStartResponse,
  },
  list: {
    method: 'GET' as const,
    path: '/runs',
    response: {} as RunSnapshot[],
  },
  stop: (runId: string) => ({
    method: 'POST' as const,
    path: `/stop/${runId}`,
    response: {} as RunSnapshot,
  }),
} as const;

export const configRoutes = {
  getEnv: {
    method: 'GET' as const,
    path: '/env',
    response: {} as EnvData,
  },
  setEnv: {
    method: 'POST' as const,
    path: '/env',
    response: {} as EnvData,
  },
  dataVendors: {
    method: 'GET' as const,
    path: '/data_vendors',
    response: {} as DataVendorsResponse,
  },
} as const;

export const reportRoutes = {
  list: {
    method: 'GET' as const,
    path: '/reports',
    response: {} as ReportMeta[],
  },
  tree: {
    method: 'GET' as const,
    path: '/reports/tree',
    response: {} as ReportSection,
  },
  read: {
    method: 'GET' as const,
    path: '/reports/read',
    response: {} as { path: string; content: string },
  },
  delete: {
    method: 'POST' as const,
    path: '/reports/delete',
    response: undefined as void,
  },
  export: {
    method: 'GET' as const,
    path: '/reports/export',
    response: {} as Blob,
  },
  checkUrls: {
    method: 'GET' as const,
    path: '/reports/check_urls',
    response: {} as { urls: { url: string; status: string; status_code: number | null }[] },
  },
} as const;

export const estimateRoutes = {
  estimate: {
    method: 'POST' as const,
    path: '/estimate',
    response: {} as CostEstimate,
  },
} as const;

export const apiKeyRoutes = {
  test: {
    method: 'POST' as const,
    path: '/test_key',
    response: {} as TestKeyResponse,
  },
  installMissing: {
    method: 'POST' as const,
    path: '/install_missing',
    response: {} as InstallResult,
  },
} as const;

export const chatRoutes = {
  sessions: {
    list: {
      method: 'GET' as const,
      path: '/chat/sessions',
      response: {} as ChatSessionSummary[],
    },
    create: {
      method: 'POST' as const,
      path: '/chat/sessions',
      response: {} as ChatSession,
    },
    get: (id: string) => ({
      method: 'GET' as const,
      path: `/chat/sessions/${id}`,
      response: {} as ChatSession,
    }),
    delete: (id: string) => ({
      method: 'DELETE' as const,
      path: `/chat/sessions/${id}`,
      response: undefined as void,
    }),
    patch: (id: string) => ({
      method: 'PATCH' as const,
      path: `/chat/sessions/${id}`,
      response: {} as ChatSession,
    }),
  },
  sendMessage: (id: string) => ({
    method: 'POST' as const,
    path: `/chat/sessions/${id}/messages`,
    response: {} as ReadableStream<ChatMessageStream>,
  }),
} as const;

export const schedulerRoutes = {
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/scheduler/jobs',
      response: {} as SchedulerJob[],
    },
    create: {
      method: 'POST' as const,
      path: '/scheduler/jobs',
      response: {} as SchedulerJob,
    },
    delete: (jobId: string) => ({
      method: 'DELETE' as const,
      path: `/scheduler/jobs/${jobId}`,
      response: undefined as void,
    }),
  },
} as const;

export const historyRoutes = {
  stats: {
    method: 'GET' as const,
    path: '/history/stats',
    response: {} as HistoryStats,
  },
  runs: {
    method: 'GET' as const,
    path: '/history/runs',
    response: {} as RunRecord[],
  },
  scheduler: {
    method: 'GET' as const,
    path: '/history/scheduler',
    response: {} as SchedulerAudit[],
  },
} as const;

export const memoryRoutes = {
  status: {
    method: 'GET' as const,
    path: '/memory/status',
    response: {} as MemoryStatus,
  },
  sync: {
    method: 'POST' as const,
    path: '/memory/sync',
    response: {} as SyncResult,
  },
  search: {
    method: 'POST' as const,
    path: '/memory/search',
    response: {} as MemorySearchResult[],
  },
} as const;

export const dockerRoutes = {
  info: {
    method: 'GET' as const,
    path: '/docker/info',
    response: {} as DockerInfo,
  },
} as const;

export const tickerNameRoutes = {
  get: {
    method: 'GET' as const,
    path: '/ticker/names',
    response: {} as Record<string, string>,
  },
  update: {
    method: 'PUT' as const,
    path: '/ticker/names',
    response: undefined as void,
  },
} as const;

export const routes = {
  health: healthRoutes,
  providers: providerRoutes,
  presets: presetRoutes,
  analyze: analyzeRoutes,
  config: configRoutes,
  reports: reportRoutes,
  estimate: estimateRoutes,
  apiKeys: apiKeyRoutes,
  chat: chatRoutes,
  scheduler: schedulerRoutes,
  history: historyRoutes,
  memory: memoryRoutes,
  docker: dockerRoutes,
  tickers: tickerNameRoutes,
} as const;

export type RouteResponse<T extends Route> = T extends Route<any, infer R> ? R : never;
export type RouteParams<T extends Route> = T extends Route<infer P, any> ? P : never;