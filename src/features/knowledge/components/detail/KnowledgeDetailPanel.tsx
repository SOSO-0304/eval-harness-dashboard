import { forwardRef } from 'react';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { IconDoc } from '@/shared/ui/Icons';
import type { KnowledgeNode, NodeDetail, Proposal } from '../../model/types';
import { domainLabel } from '../../model/domains';
import { effectiveStatus, freshnessGrade, nodeGrade, signed, STATUS_BADGE } from '../../model/rules';
import { MetricCard } from './MetricCard';
import { FreshnessDonut } from './FreshnessDonut';
import { ApprovalBox } from './ApprovalBox';
import s from './detail.module.css';

const DONUT: Record<string, string> = { good: '#052699', fair: '#E0A100', poor: '#F13E3E' };

interface Props {
  node: KnowledgeNode | null;
  detail?: NodeDetail;
  proposal?: Proposal;
  byId: Map<string, KnowledgeNode>;
  busy: boolean;
  onSelect: (id: string) => void;
  onApprove: () => void;
  onDefer: () => void;
  onUndo: () => void;
}

export const KnowledgeDetailPanel = forwardRef<HTMLElement, Props>(function KnowledgeDetailPanel(
  { node, detail, proposal, byId, busy, onSelect, onApprove, onDefer, onUndo }, ref,
) {
  if (!node) {
    return (
      <aside ref={ref} id="detail" className={`${s.panel} ${s.empty}`} aria-label="지식 상세 정보">
        <p>그래프에서 지식을 선택하면 영향도와 변경 제안이 여기에 표시됩니다.</p>
      </aside>
    );
  }
  const learn = node.status === 'learn';
  const eff = effectiveStatus(node, proposal);
  const badge = STATUS_BADGE[eff];
  const grade = nodeGrade(node);
  const series = detail?.impactSeries ?? [];
  const delta = node.status === 'keep' ? '↗ 2' : node.status === 'watch' ? '↘ 1' : learn ? '↗ 14건' : '↘ 5';

  return (
    <aside ref={ref} id="detail" className={s.panel} aria-label="지식 상세 정보" tabIndex={-1}>
      <div className={s.col}>
        <div className={s.panelTop}>
          <span className={s.docIcon}><IconDoc size={18} /></span>
          <span className={s.more}>자세히 보기 ›</span>
        </div>
        <div className={s.nameBlock}>
          <h2 className={s.name}>{node.label}</h2>
          <div className={s.badgeRow}>
            <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
            <span className={s.typeText}>{domainLabel(node.domain)} · {node.sourceLabel}</span>
          </div>
          <span className={s.added}>추가일 {node.addedAt ? node.addedAt.replace(/-/g, '.') : '—'}</span>
        </div>
        <MetricCard
          category={learn ? 'GAP' : 'IMPACT'}
          code={learn ? 'KNOWLEDGE_GAP' : 'PERFORMANCE_IMPACT'}
          title={learn ? '지식 공백 영향' : '성능 영향도'}
          grade={grade}
          description={learn ? '근거 부족으로 미흡 판정된 관련 응답 비율' : '이 지식이 응답 품질에 기여하는 정도'}
          value={learn ? `${node.gap?.failRate ?? 0}%` : signed(node.impact ?? 0)}
          delta={delta}
          series={series}
        />
      </div>

      <div className={s.col}>
        <div className={s.minis}>
          <div className={s.mini}>
            {learn
              ? <FreshnessDonut value={node.gap?.relevance ?? null} color="#40E0D0" suffix="%" />
              : <FreshnessDonut value={node.freshness} color={DONUT[freshnessGrade(node.freshness ?? 0)]} />}
            <div className={s.miniText}>
              <span className={s.miniTitle}>{learn ? '기존 지식 연관도' : '최신성'}</span>
              <span className={s.miniDesc}>{learn ? '보유 지식과의 연결 강도' : '100점 기준 시점 적합도'}</span>
            </div>
          </div>
          <div className={`${s.mini} ${s.miniCol}`}>
            <span className={s.miniTitle}>{learn ? '관련 질의 (30일)' : '최근 30일 참조'}</span>
            <span className={s.miniValue}>{learn ? node.gap?.queries30d : node.usage30d}<small>{learn ? '건' : '회'}</small></span>
          </div>
        </div>
        <div className={s.reason}>
          <span className={s.reasonTitle}>{node.status === 'keep' ? '유지 근거' : node.status === 'watch' ? '검토 사유' : '변경이 필요한 이유'}</span>
          <p>{node.reason}</p>
        </div>
        {node.related.length ? (
          <div className={s.related}>
            <span className={s.reasonTitle}>연관 지식</span>
            <div className={s.chips}>
              {node.related.map((r) => {
                const o = byId.get(r.id);
                if (!o) return null;
                const conflict = r.relation === 'conflict';
                return (
                  <button key={r.id} type="button" className={`${s.relChip} ${conflict ? s.relConflict : ''}`} onClick={() => onSelect(o.id)}>
                    {conflict ? '⚠ ' : ''}{o.label}{conflict ? ' · 충돌' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className={s.col}>
        {node.gap ? (
          <div className={s.related}>
            <span className={s.reasonTitle}>추가 학습 소스 후보</span>
            <ul className={s.sources}>
              {node.gap.sources.map((src) => <li key={src.id}><span className={s.srcDot} />{src.kind} · {src.title}</li>)}
            </ul>
          </div>
        ) : null}
        <ApprovalBox node={node} proposal={proposal} busy={busy} onApprove={onApprove} onDefer={onDefer} onUndo={onUndo} />
        {node.status === 'unlearn' ? (
          <p className={s.note}>Unlearning은 해당 지식의 참조를 차단하는 방식으로 적용되며, Learning 이력에서 언제든 복원할 수 있습니다.</p>
        ) : null}
      </div>
    </aside>
  );
});
