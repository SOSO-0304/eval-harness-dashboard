import { StatusBadge } from '@/shared/ui/StatusBadge';
import type { GraphFilter, KnowledgeNode, Proposal } from '../../model/types';
import { domainColor, domainLabel } from '../../model/domains';
import { effectiveStatus, isActionNode, signed, STATUS_BADGE } from '../../model/rules';
import s from './graph.module.css';

/** 그래프 대체 수단: 같은 데이터를 표로 보여준다 (스크린 리더, 키보드 사용자) */
export function GraphListView({ nodes, proposalByNode, filter, selectedId, onSelect }: {
  nodes: KnowledgeNode[]; proposalByNode: Map<string, Proposal>; filter: GraphFilter; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const rows = nodes
    .filter((n) => (filter === 'action' ? isActionNode(n) : filter ? n.domain === filter : true))
    .sort((a, b) => Number(isActionNode(b)) - Number(isActionNode(a)) || (a.impact ?? -99) - (b.impact ?? -99));
  return (
    <div className={s.listWrap}>
      <table className={s.table}>
        <caption className="sr-only">지식 목록, 조치 필요 항목 우선, 영향도 낮은 순</caption>
        <thead><tr><th scope="col">지식</th><th scope="col">분야</th><th scope="col">상태</th><th scope="col">영향도</th><th scope="col">최신성</th><th scope="col">30일 참조</th></tr></thead>
        <tbody>
          {rows.map((n) => {
            const b = STATUS_BADGE[effectiveStatus(n, proposalByNode.get(n.id))];
            return (
              <tr key={n.id} className={selectedId === n.id ? s.rowSel : undefined}>
                <td><button type="button" className={s.rowBtn} onClick={() => onSelect(n.id)}>{n.label}</button></td>
                <td><span className={s.tipDot} style={{ background: domainColor(n.domain) }} /> {domainLabel(n.domain)}</td>
                <td><StatusBadge tone={b.tone} size="sm">{b.label}</StatusBadge></td>
                <td>{n.impact === null ? '–' : signed(n.impact)}</td>
                <td>{n.freshness ?? '–'}</td>
                <td>{n.usage30d ?? '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
