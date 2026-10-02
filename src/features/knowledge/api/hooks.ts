import {
  useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData,
} from '@tanstack/react-query';
import { knowledgeApi, ApiError } from './client';
import type {
  DecisionResult, HealthScore, KnowledgeLog, LogPage, PipelineStep, Proposal,
} from '../model/types';
import { computePipeline, gradeOf } from '../model/rules';
import { useUiStore } from '../store/uiStore';

export const qk = {
  graph: (a: string) => ['knowledge', a, 'graph'] as const,
  node: (a: string, n: string) => ['knowledge', a, 'node', n] as const,
  health: (a: string) => ['knowledge', a, 'health'] as const,
  pipeline: (a: string) => ['knowledge', a, 'pipeline'] as const,
  proposals: (a: string) => ['knowledge', a, 'proposals'] as const,
  logs: (a: string) => ['knowledge', a, 'logs'] as const,
};

const REFRESH = 60_000;

export const useGraph = (agentId: string) =>
  useQuery({ queryKey: qk.graph(agentId), queryFn: () => knowledgeApi.graph(agentId), refetchInterval: REFRESH, staleTime: 30_000 });

export const useNodeDetail = (agentId: string, nodeId: string | null) =>
  useQuery({
    queryKey: qk.node(agentId, nodeId ?? ''),
    queryFn: () => knowledgeApi.node(agentId, nodeId!),
    enabled: !!nodeId,
    staleTime: 60_000,
  });

export const useHealth = (agentId: string) =>
  useQuery({ queryKey: qk.health(agentId), queryFn: () => knowledgeApi.health(agentId), refetchInterval: REFRESH });

export const usePipeline = (agentId: string) =>
  useQuery({ queryKey: qk.pipeline(agentId), queryFn: () => knowledgeApi.pipeline(agentId), refetchInterval: REFRESH });

export const useProposals = (agentId: string) =>
  useQuery({ queryKey: qk.proposals(agentId), queryFn: () => knowledgeApi.proposals(agentId), refetchInterval: REFRESH });

export const useLogs = (agentId: string) =>
  useInfiniteQuery({
    queryKey: qk.logs(agentId),
    queryFn: ({ pageParam }) => knowledgeApi.logs(agentId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last: LogPage) => last.nextCursor,
    refetchInterval: REFRESH,
  });

type Snapshot = {
  proposals?: Proposal[];
  health?: HealthScore;
  pipeline?: PipelineStep[];
  logs?: InfiniteData<LogPage, string | null>;
};

/**
 * 승인·보류·되돌리기 — 낙관적 업데이트.
 * 1) 스냅샷 저장 → 2) 제안·건강도·흐름·이력 먼저 반영 → 3) 성공 시 서버 값으로 덮어쓰기 → 4) 실패 시 롤백
 */
export function useProposalAction(agentId: string, totalKnowledge: number) {
  const qc = useQueryClient();
  const notify = useUiStore((s) => s.notify);

  return useMutation<
    DecisionResult,
    unknown,
    { proposal: Proposal; action: 'approved' | 'deferred' | 'undo'; nodeLabel: string },
    Snapshot
  >({
    mutationFn: ({ proposal, action }) =>
      action === 'undo' ? knowledgeApi.undo(agentId, proposal.id) : knowledgeApi.decide(agentId, proposal.id, action),

    onMutate: async ({ proposal, action, nodeLabel }) => {
      await Promise.all([qk.proposals, qk.health, qk.pipeline, qk.logs].map((f) => qc.cancelQueries({ queryKey: f(agentId) })));
      const snap: Snapshot = {
        proposals: qc.getQueryData(qk.proposals(agentId)),
        health: qc.getQueryData(qk.health(agentId)),
        pipeline: qc.getQueryData(qk.pipeline(agentId)),
        logs: qc.getQueryData(qk.logs(agentId)),
      };
      const decision: Proposal['decision'] = action === 'undo' ? 'pending' : action;
      const nextProposals: Proposal[] = (snap.proposals ?? []).map((p) => (p.id === proposal.id ? { ...p, decision } : p));
      qc.setQueryData(qk.proposals(agentId), nextProposals);
      qc.setQueryData(qk.pipeline(agentId), computePipeline(totalKnowledge, nextProposals));
      if (snap.health) {
        const sign = action === 'approved' ? 1 : proposal.decision === 'approved' && action === 'undo' ? -1 : 0;
        const score = snap.health.score + sign * proposal.expectedGain;
        qc.setQueryData(qk.health(agentId), { ...snap.health, score, grade: gradeOf(score) });
      }
      if (snap.logs) {
        const tag: KnowledgeLog['tag'] = action === 'approved' ? 'APPROVE' : action === 'deferred' ? 'DEFER' : 'UNDO';
        const temp: KnowledgeLog = { id: `temp-${Date.now()}`, at: new Date().toISOString(), tag, message: `${nodeLabel} · 처리 중` };
        qc.setQueryData(qk.logs(agentId), {
          ...snap.logs,
          pages: snap.logs.pages.map((pg, i) => (i === 0 ? { ...pg, items: [temp, ...pg.items] } : pg)),
        });
      }
      return snap;
    },

    onError: (err, _vars, snap) => {
      if (snap) {
        qc.setQueryData(qk.proposals(agentId), snap.proposals);
        qc.setQueryData(qk.health(agentId), snap.health);
        qc.setQueryData(qk.pipeline(agentId), snap.pipeline);
        qc.setQueryData(qk.logs(agentId), snap.logs);
      }
      const status = err instanceof ApiError ? err.status : 0;
      notify(
        status === 409 ? '다른 사용자가 먼저 처리했습니다. 최신 상태로 다시 불러왔습니다.'
          : status === 403 ? '승인 권한이 필요합니다.'
          : status === 400 ? '요청을 처리할 수 없습니다.'
          : '처리하지 못했습니다. 다시 시도해 주세요.',
      );
      if (status === 404) useUiStore.getState().select(null);
    },

    onSuccess: (res) => {
      qc.setQueryData<Proposal[]>(qk.proposals(agentId), (old) => (old ?? []).map((p) => (p.id === res.proposal.id ? res.proposal : p)));
      qc.setQueryData(qk.health(agentId), res.health);
      qc.setQueryData(qk.pipeline(agentId), res.pipeline);
      qc.setQueryData<InfiniteData<LogPage, string | null>>(qk.logs(agentId), (old) =>
        old
          ? { ...old, pages: old.pages.map((pg, i) => (i === 0 ? { ...pg, items: [res.log, ...pg.items.filter((l) => !l.id.startsWith('temp-'))] } : pg)) }
          : old,
      );
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', agentId] });
    },
  });
}
