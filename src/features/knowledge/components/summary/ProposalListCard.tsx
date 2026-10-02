import type { KnowledgeNode, Proposal, ProposalKind } from '../../model/types';
import { domainLabel } from '../../model/domains';
import s from '../page.module.css';

interface Item { node: KnowledgeNode; proposal: Proposal }

export function ProposalListCard({ kind, items, onView }: { kind: ProposalKind; items: Item[]; onView: (nodeId: string) => void }) {
  const learn = kind === 'learn';
  return (
    <section className={`${s.card} ${s.listCard}`} aria-label={learn ? 'Learning 필요 영역' : 'Unlearning 후보'}>
      <div className={s.cardTitleRow}>
        <h2 className={s.cardTitle}>{learn ? 'Learning 필요 영역' : 'Unlearning 후보'}</h2>
        <span className={learn ? s.countLearn : s.countUnlearn}>{items.length}건</span>
      </div>
      <p className={s.cardSub}>{learn ? '업무에 필요하지만 AI에게 부족한 지식' : '오래되었거나 성능을 떨어뜨리는 지식·메모리'}</p>
      <ul className={s.propList}>
        {items.map(({ node, proposal }) => {
          const d = proposal.decision;
          return (
            <li key={proposal.id} className={s.propItem}>
              <div className={s.propText}>
                <span className={s.propName}>
                  {learn
                    ? <span className={s.upMint}>▲ +{proposal.expectedGain}</span>
                    : <span className={s.downRed}>▼ {node.impact}</span>}{' '}
                  {node.label}
                </span>
                <span className={s.propMeta}>
                  {domainLabel(node.domain)} · {learn ? `관련 질의 ${node.gap?.queries30d ?? 0}건` : `최신성 ${node.freshness}`}
                </span>
              </div>
              <button type="button" className={`${s.propBtn} ${d === 'approved' ? s.upMint : d === 'deferred' ? s.mutedText : ''}`} onClick={() => onView(node.id)}>
                {d === 'approved' ? '✓ 승인됨' : d === 'deferred' ? '보류됨' : '보기'} ›
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
