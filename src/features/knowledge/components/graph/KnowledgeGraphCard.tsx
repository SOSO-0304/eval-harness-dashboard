import { IconGraph, IconList } from '@/shared/ui/Icons';
import type { DomainKey, GraphFilter, HealthScore, KnowledgeGraph, Proposal } from '../../model/types';
import { FilterChips } from './FilterChips';
import { GraphCanvas } from './GraphCanvas';
import { GraphLegend } from './GraphLegend';
import { GraphListView } from './GraphListView';
import { SelectionBar } from './SelectionBar';
import s from './graph.module.css';

interface Props {
  graph: KnowledgeGraph;
  health?: HealthScore;
  proposalByNode: Map<string, Proposal>;
  pendingCount: number;
  selectedId: string | null;
  hoveredId: string | null;
  filter: GraphFilter;
  listView: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onFilter: (f: GraphFilter) => void;
  onToggleDomain: (d: DomainKey) => void;
  onListView: (v: boolean) => void;
  onApprove: () => void;
  onDefer: () => void;
  onUndo: () => void;
  onOpenDetail: () => void;
}

export function KnowledgeGraphCard(p: Props) {
  const node = p.selectedId ? p.graph.nodes.find((n) => n.id === p.selectedId) ?? null : null;
  return (
    <section id="graph-card" className={s.card} aria-label="Knowledge Graph">
      <div className={s.head}>
        <div className={s.headMain}>
          <span className={s.headIcon}><IconGraph size={18} /></span>
          <div className={s.headText}>
            <h2 className={s.title}>Knowledge Graph</h2>
            <span className={s.desc}>노드에 마우스를 올리면 요약을, 선택하면 영향도와 실행 제안을 볼 수 있어요</span>
          </div>
        </div>
        <div className={s.headSide}>
          <span className={s.count}>대표 지식 {p.graph.meta.nodeCount}개 · 연결 {p.graph.meta.edgeCount}개</span>
          <button type="button" className={s.viewToggle} aria-pressed={p.listView} onClick={() => p.onListView(!p.listView)}>
            {p.listView ? <><IconGraph />그래프로 보기</> : <><IconList />목록으로 보기</>}
          </button>
        </div>
      </div>
      <FilterChips domains={p.graph.domains} totalKnowledge={p.graph.meta.totalKnowledge} actionCount={p.pendingCount} filter={p.filter} onChange={p.onFilter} />
      {p.listView ? (
        <GraphListView nodes={p.graph.nodes} proposalByNode={p.proposalByNode} filter={p.filter} selectedId={p.selectedId} onSelect={p.onSelect} />
      ) : (
        <GraphCanvas
          nodes={p.graph.nodes} edges={p.graph.edges} domains={p.graph.domains} totalKnowledge={p.graph.meta.totalKnowledge}
          health={p.health} proposalByNode={p.proposalByNode} selectedId={p.selectedId} hoveredId={p.hoveredId} filter={p.filter}
          onSelect={p.onSelect} onHover={p.onHover} onToggleDomain={p.onToggleDomain} onClearFilter={() => p.onFilter(null)}
        />
      )}
      <GraphLegend />
      <SelectionBar node={node} proposal={node ? p.proposalByNode.get(node.id) : undefined} busy={p.busy}
        onApprove={p.onApprove} onDefer={p.onDefer} onUndo={p.onUndo} onOpenDetail={p.onOpenDetail} />
    </section>
  );
}
