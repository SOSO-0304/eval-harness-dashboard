import { useMemo } from 'react';
import { useGraph, useProposals } from '../api/hooks';
import type { KnowledgeNode, Proposal } from './types';

/** 그래프 + 제안을 합쳐 화면에서 바로 쓰는 형태로 만든다 */
export function useDashboard(agentId: string) {
  const graph = useGraph(agentId);
  const proposals = useProposals(agentId);

  const view = useMemo(() => {
    const nodes = graph.data?.nodes ?? [];
    const byId = new Map<string, KnowledgeNode>(nodes.map((n) => [n.id, n]));
    const proposalByNode = new Map<string, Proposal>((proposals.data ?? []).map((p) => [p.nodeId, p]));
    const pending = (proposals.data ?? []).filter((p) => p.decision === 'pending');
    return { nodes, byId, proposalByNode, pendingCount: pending.length };
  }, [graph.data, proposals.data]);

  return { graph, proposals, ...view };
}
