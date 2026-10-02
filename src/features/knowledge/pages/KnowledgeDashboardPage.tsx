import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Shell } from '@/shared/ui/Shell';
import { Toast } from '@/shared/ui/Toast';
import { useHealth, useLogs, useNodeDetail, usePipeline, useProposalAction } from '../api/hooks';
import { useDashboard } from '../model/useDashboard';
import { useUiStore } from '../store/uiStore';
import { AgentHeader } from '../components/header/AgentHeader';
import { PipelineStepper } from '../components/pipeline/PipelineStepper';
import { KnowledgeGraphCard } from '../components/graph/KnowledgeGraphCard';
import { HealthScoreCard } from '../components/summary/HealthScoreCard';
import { ProposalListCard } from '../components/summary/ProposalListCard';
import { KnowledgeDetailPanel } from '../components/detail/KnowledgeDetailPanel';
import { ChangeLog } from '../components/log/ChangeLog';
import type { KnowledgeNode, Proposal } from '../model/types';
import s from '../components/page.module.css';

const AGENT_ID = 'agent-01';

export function KnowledgeDashboardPage() {
  const { graph, byId, proposalByNode, pendingCount, proposals } = useDashboard(AGENT_ID);
  const health = useHealth(AGENT_ID);
  const pipeline = usePipeline(AGENT_ID);
  const logs = useLogs(AGENT_ID);

  const { selectedId, hoveredId, filter, listView, select, initSelect, hover, setFilter, toggleFilter, setListView } = useUiStore();
  const detail = useNodeDetail(AGENT_ID, selectedId);
  const action = useProposalAction(AGENT_ID, graph.data?.meta.totalKnowledge ?? 0);
  const detailRef = useRef<HTMLElement>(null);

  // 첫 진입: 영향도가 가장 낮은 미결 Unlearning 노드를 선택
  useEffect(() => {
    if (!graph.data || !proposals.data) return;
    const first = proposals.data
      .filter((p) => p.decision === 'pending' && p.kind === 'unlearn')
      .map((p) => byId.get(p.nodeId))
      .filter((n): n is KnowledgeNode => !!n)
      .sort((a, b) => (a.impact ?? 0) - (b.impact ?? 0))[0];
    if (first) initSelect(first.id);
  }, [graph.data, proposals.data, byId, initSelect]);

  // Esc: 선택 해제
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') select(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select]);

  const selectedNode = selectedId ? byId.get(selectedId) ?? null : null;
  const selectedProposal = selectedNode ? proposalByNode.get(selectedNode.id) : undefined;
  const busy = action.isPending && action.variables?.proposal.id === selectedProposal?.id;

  const run = useCallback((kind: 'approved' | 'deferred' | 'undo', p?: Proposal, n?: KnowledgeNode | null) => {
    if (!p || !n) return;
    action.mutate({ proposal: p, action: kind, nodeLabel: n.label });
  }, [action]);

  const openDetail = () => {
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    detailRef.current?.focus({ preventScroll: true });
  };
  const viewFromList = (id: string) => {
    select(id);
    document.getElementById('graph-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const lists = useMemo(() => {
    const items = (proposals.data ?? [])
      .map((p) => ({ proposal: p, node: byId.get(p.nodeId) }))
      .filter((x): x is { proposal: Proposal; node: KnowledgeNode } => !!x.node);
    return { learn: items.filter((x) => x.proposal.kind === 'learn'), unlearn: items.filter((x) => x.proposal.kind === 'unlearn') };
  }, [proposals.data, byId]);

  const allLogs = logs.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Shell>
      <div className={s.content}>
        <AgentHeader agent={graph.data?.agent} totalKnowledge={graph.data?.meta.totalKnowledge} pendingCount={pendingCount} />
        {pipeline.data ? <PipelineStepper steps={pipeline.data} /> : null}

        {graph.isError ? (
          <div role="alert" className={s.card} style={{ padding: 24 }}>
            지식 그래프를 불러오지 못했습니다. <button type="button" onClick={() => graph.refetch()}>다시 시도</button>
          </div>
        ) : graph.data ? (
          <KnowledgeGraphCard
            graph={graph.data} health={health.data} proposalByNode={proposalByNode} pendingCount={pendingCount}
            selectedId={selectedId} hoveredId={hoveredId} filter={filter} listView={listView} busy={busy}
            onSelect={select} onHover={hover} onFilter={setFilter} onToggleDomain={toggleFilter} onListView={setListView}
            onApprove={() => run('approved', selectedProposal, selectedNode)}
            onDefer={() => run('deferred', selectedProposal, selectedNode)}
            onUndo={() => run('undo', selectedProposal, selectedNode)}
            onOpenDetail={openDetail}
          />
        ) : (
          <div className={s.card} style={{ padding: 24, color: 'var(--text-tertiary)' }} aria-busy="true">지식 그래프를 불러오는 중</div>
        )}

        <div className={s.cards}>
          <HealthScoreCard health={health.data} />
          <ProposalListCard kind="learn" items={lists.learn} onView={viewFromList} />
          <ProposalListCard kind="unlearn" items={lists.unlearn} onView={viewFromList} />
        </div>

        <KnowledgeDetailPanel
          ref={detailRef} node={selectedNode} detail={detail.data} proposal={selectedProposal} byId={byId} busy={busy}
          onSelect={select}
          onApprove={() => run('approved', selectedProposal, selectedNode)}
          onDefer={() => run('deferred', selectedProposal, selectedNode)}
          onUndo={() => run('undo', selectedProposal, selectedNode)}
        />

        <ChangeLog logs={allLogs} hasMore={!!logs.hasNextPage} loadingMore={logs.isFetchingNextPage} onMore={() => logs.fetchNextPage()} />
      </div>
      <Toast />
    </Shell>
  );
}
