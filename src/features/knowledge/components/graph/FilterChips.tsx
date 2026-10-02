import type { DomainSummary, GraphFilter } from '../../model/types';
import { domainColor } from '../../model/domains';
import s from './graph.module.css';

interface Props {
  domains: DomainSummary[];
  totalKnowledge: number;
  actionCount: number;
  filter: GraphFilter;
  onChange: (f: GraphFilter) => void;
}

export function FilterChips({ domains, totalKnowledge, actionCount, filter, onChange }: Props) {
  const chip = (key: GraphFilter, label: string, count: string, dot?: string) => {
    const on = filter === key;
    return (
      <button key={String(key)} type="button" className={`${s.chip} ${on ? s.chipOn : ''}`} aria-pressed={on}
        onClick={() => onChange(key === null || on ? null : key)}>
        {dot ? <span className={s.chipDot} style={{ background: dot }} /> : null}
        {label}<span className={s.chipCount}>{count}</span>
      </button>
    );
  };
  return (
    <div className={s.chips} role="group" aria-label="그래프 필터">
      {chip(null, '전체', totalKnowledge.toLocaleString('ko-KR'))}
      {domains.map((d) => chip(d.key, d.label, String(d.count), domainColor(d.key)))}
      {chip('action', '조치 필요', String(actionCount), 'var(--badge-unlearn)')}
    </div>
  );
}
