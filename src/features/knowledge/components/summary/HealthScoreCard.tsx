import { StatusBadge } from '@/shared/ui/StatusBadge';
import type { HealthScore } from '../../model/types';
import { GRADE_LABEL } from '../../model/rules';
import s from '../page.module.css';

const arrow = (n: number) => (n >= 0 ? `↗ ${n}` : `↘ ${Math.abs(n)}`);

export function HealthScoreCard({ health }: { health?: HealthScore }) {
  return (
    <section className={`${s.card} ${s.health}`} aria-label="지식 건강도">
      <div className={s.cardHead}>
        <div className={s.cardTitleRow}>
          <h2 className={s.cardTitle}>지식 건강도</h2>
          {health ? <StatusBadge tone={health.grade}>{GRADE_LABEL[health.grade]}</StatusBadge> : null}
        </div>
        {health ? <span className={s.meta}>최근 30일간 <b className={health.delta30d < 0 ? s.down : s.up}>{arrow(health.delta30d)}</b></span> : null}
      </div>
      <div className={s.today}>오늘 {health ? <b className={health.deltaToday < 0 ? s.down : s.upMint}>{arrow(health.deltaToday)}</b> : null}</div>
      <div className={s.healthRow}>
        <span className={s.healthScore} aria-live="polite">{health?.score ?? '–'}</span>
        {health ? (
          <span className={s.healthBubble}><b>최대 {health.maxIfAllApplied}점</b><span>제안 모두 반영 시</span></span>
        ) : null}
      </div>
      <p className={s.healthNote}>보유 지식이 업무 성능을 얼마나 잘 지지하는지 나타내는 종합 점수</p>
    </section>
  );
}
