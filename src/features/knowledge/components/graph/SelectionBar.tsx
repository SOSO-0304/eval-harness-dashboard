import { StatusBadge } from '@/shared/ui/StatusBadge';
import ui from '@/shared/ui/ui.module.css';
import type { KnowledgeNode, Proposal } from '../../model/types';
import { domainColor, domainLabel } from '../../model/domains';
import { effectiveStatus, signed, STATUS_BADGE } from '../../model/rules';
import s from './graph.module.css';

interface Props {
  node: KnowledgeNode | null;
  proposal?: Proposal;
  busy: boolean;
  onApprove: () => void;
  onDefer: () => void;
  onUndo: () => void;
  onOpenDetail: () => void;
}

export function SelectionBar({ node, proposal, busy, onApprove, onDefer, onUndo, onOpenDetail }: Props) {
  if (!node) {
    return (
      <div className={s.selBar}>
        <div className={s.selMain}>
          <span className={s.selEyebrow}>선택한 지식</span>
          <span className={s.selName}>살펴볼 노드를 선택하세요</span>
          <span className={s.selReason}>마우스를 올리면 요약을, 선택하면 영향도와 실행 제안을 볼 수 있어요.</span>
        </div>
      </div>
    );
  }
  const eff = effectiveStatus(node, proposal);
  const b = STATUS_BADGE[eff];
  const metrics = node.gap
    ? [['예상 효과', `+${proposal?.expectedGain ?? 0}`, 'var(--brand-mint-text)'], ['관련 질의', `${node.gap.queries30d}건`], ['연관도', `${node.gap.relevance}%`]]
    : [['영향도', signed(node.impact ?? 0), (node.impact ?? 0) < 0 ? 'var(--grade-poor)' : 'var(--grade-good)'], ['최신성', String(node.freshness)], ['30일 참조', `${node.usage30d}회`]];
  return (
    <div className={s.selBar} aria-live="polite">
      <div className={s.selMain}>
        <span className={s.selEyebrow}><span className={s.tipDot} style={{ background: domainColor(node.domain) }} />선택한 지식 · {domainLabel(node.domain)}</span>
        <span className={s.selNameRow}><span className={s.selName}>{node.label}</span><StatusBadge tone={b.tone}>{b.label}</StatusBadge></span>
        <span className={s.selReason}>{node.reason}</span>
      </div>
      <dl className={s.selMetrics}>
        {metrics.map(([k, v, c]) => (
          <div key={k}><dt>{k}</dt><dd style={c ? { color: c } : undefined}>{v}</dd></div>
        ))}
      </dl>
      <div className={s.selActions}>
        {proposal?.decision === 'pending' ? (
          <>
            <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onDefer} disabled={busy}>보류</button>
            <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={onApprove} disabled={busy}>
              {busy ? '처리 중' : proposal.kind === 'learn' ? 'Learning 실행' : 'Unlearning 실행'}
            </button>
          </>
        ) : null}
        {proposal && proposal.decision !== 'pending' ? (
          <>
            <span className={proposal.decision === 'approved' ? s.selDone : s.selDeferred}>{proposal.decision === 'approved' ? '✓ 승인 완료' : '보류됨'}</span>
            <button type="button" className={ui.btnLink} onClick={onUndo} disabled={busy}>되돌리기</button>
          </>
        ) : null}
        <button type="button" className={`${ui.btn} ${ui.btnSecondary}`} onClick={onOpenDetail}>상세 보기 ↓</button>
      </div>
    </div>
  );
}
