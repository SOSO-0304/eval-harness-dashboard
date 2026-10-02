import { StatusBadge, type Tone } from '@/shared/ui/StatusBadge';
import s from './graph.module.css';

export interface TooltipContent {
  dot: string;
  eyebrow: string;
  title: string;
  badge: { label: string; tone: Tone };
  line: string;
  foot: string;
}

export function GraphTooltip({ content, left, top }: { content: TooltipContent; left: number; top: number }) {
  return (
    <div className={s.tooltip} style={{ left, top }} role="tooltip">
      <div className={s.tipHead}>
        <span className={s.tipDot} style={{ background: content.dot }} />
        <span className={s.tipEyebrow}>{content.eyebrow}</span>
        <StatusBadge tone={content.badge.tone} size="sm">{content.badge.label}</StatusBadge>
      </div>
      <div className={s.tipTitle}>{content.title}</div>
      <div className={s.tipLine}>{content.line}</div>
      <div className={s.tipFoot}>{content.foot}</div>
    </div>
  );
}
