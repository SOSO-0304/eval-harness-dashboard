import type { KnowledgeNode, Proposal } from '../../model/types';
import ui from '@/shared/ui/ui.module.css';
import s from './detail.module.css';

interface Props {
  node: KnowledgeNode;
  proposal?: Proposal;
  busy: boolean;
  onApprove: () => void;
  onDefer: () => void;
  onUndo: () => void;
}

/** 미결 → 질문 + 보류/실행, 결정됨 → 결과 + 되돌리기, 제안 없음 → 안내 */
export function ApprovalBox({ node, proposal, busy, onApprove, onDefer, onUndo }: Props) {
  if (!proposal) {
    return node.status === 'watch' ? (
      <div className={`${s.info} ${s.infoFair}`}>모니터링 중입니다. 최신성이 30 이하로 떨어지거나 성능 저하와 연관되면 Unlearning 후보로 제안됩니다.</div>
    ) : (
      <div className={`${s.info} ${s.infoGood}`}>현재 성능 유지에 기여하고 있는 지식입니다. 별도 조치가 필요하지 않습니다.</div>
    );
  }
  const learn = proposal.kind === 'learn';
  if (proposal.decision === 'pending') {
    return (
      <div className={`${s.ask} ${learn ? s.askLearn : s.askUnlearn}`}>
        <p className={s.question}>{proposal.question}</p>
        <span className={s.gain}>예상 효과 · 지식 건강도 <b>+{proposal.expectedGain}</b></span>
        <div className={s.askButtons}>
          <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnSecondary}`} onClick={onDefer} disabled={busy}>보류</button>
          <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`} onClick={onApprove} disabled={busy}>
            {busy ? '처리 중' : learn ? 'Learning 실행' : 'Unlearning 실행'}
          </button>
        </div>
      </div>
    );
  }
  const approved = proposal.decision === 'approved';
  return (
    <div className={`${s.done} ${approved ? s.doneApproved : ''}`}>
      <p className={s.doneTitle}>{approved ? '✓ 승인 완료' : '보류됨'}</p>
      <p className={s.doneDesc}>
        {approved
          ? `다음 지식 반영 주기(10.03 02:00)에 적용됩니다. 예상 지식 건강도 +${proposal.expectedGain}`
          : '7일 후 성능 변화를 다시 확인하고 제안합니다.'}
      </p>
      <button type="button" className={ui.btnLink} onClick={onUndo} disabled={busy}>되돌리기</button>
    </div>
  );
}
