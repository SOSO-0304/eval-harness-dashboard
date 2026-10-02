import type {
  DecisionResult, HealthScore, KnowledgeGraph, LogPage, NodeDetail, PipelineStep, Proposal,
} from '../model/types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

const k = (agentId: string) => `/agents/${agentId}/knowledge`;

export const knowledgeApi = {
  graph: (agentId: string, period = '30d') => request<KnowledgeGraph>(`${k(agentId)}/graph?period=${period}`),
  node: (agentId: string, nodeId: string) => request<NodeDetail>(`${k(agentId)}/nodes/${nodeId}`),
  health: (agentId: string) => request<HealthScore>(`${k(agentId)}/health`),
  pipeline: (agentId: string) => request<PipelineStep[]>(`${k(agentId)}/pipeline`),
  proposals: (agentId: string) => request<Proposal[]>(`${k(agentId)}/proposals`),
  logs: (agentId: string, cursor: string | null, limit = 20) =>
    request<LogPage>(`${k(agentId)}/logs?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`),
  decide: (agentId: string, proposalId: string, decision: 'approved' | 'deferred') =>
    request<DecisionResult>(`${k(agentId)}/proposals/${proposalId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),
  undo: (agentId: string, proposalId: string) =>
    request<DecisionResult>(`${k(agentId)}/proposals/${proposalId}/undo`, { method: 'POST' }),
};

export const ERROR_MESSAGE: Record<number, string> = {
  400: '요청을 처리할 수 없습니다.',
  403: '승인 권한이 필요합니다.',
  404: '해당 지식을 찾을 수 없습니다. 그래프를 새로고침했습니다.',
  409: '다른 사용자가 먼저 처리했습니다. 최신 상태로 다시 불러왔습니다.',
};
export const errorMessage = (e: unknown) =>
  e instanceof ApiError ? ERROR_MESSAGE[e.status] ?? '서버 오류가 발생했습니다. 다시 시도해 주세요.' : '네트워크 오류가 발생했습니다.';
