import { StatusBadge } from '@/shared/ui/StatusBadge';
import type { Grade, ImpactPoint } from '../../model/types';
import { GRADE_LABEL } from '../../model/rules';
import { Sparkline } from './Sparkline';
import s from './detail.module.css';

const SPARK: Record<Grade, [string, string]> = {
  good: ['#052699', '#DCE3F7'],
  fair: ['#E0A100', '#FCEFCD'],
  poor: ['#F13E3E', '#FBDADA'],
};

interface Props {
  category: string; code: string; title: string; grade: Grade; description: string;
  value: string; delta: string; series: ImpactPoint[];
}

export function MetricCard({ category, code, title, grade, description, value, delta, series }: Props) {
  return (
    <div className={s.metric}>
      <div className={s.metricHead}><span className={s.chip}>{category}</span><span className={s.code}>{code}</span></div>
      <div className={s.metricTitleRow}><span className={s.metricTitle}>{title}</span><StatusBadge tone={grade}>{GRADE_LABEL[grade]}</StatusBadge></div>
      <span className={s.metricDesc}>{description}</span>
      <div className={s.metricValueRow}>
        <span className={s.metricValue}>{value}</span>
        <span className={s[`delta_${grade}`]}>{delta}</span>
      </div>
      <div className={s.spark}><Sparkline points={series} stroke={SPARK[grade][0]} fill={SPARK[grade][1]} /></div>
    </div>
  );
}
