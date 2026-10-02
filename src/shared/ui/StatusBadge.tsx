import s from './ui.module.css';

export type Tone = 'good' | 'fair' | 'poor' | 'learn' | 'muted';

export function StatusBadge({ tone, children, size = 'md' }: { tone: Tone; children: React.ReactNode; size?: 'sm' | 'md' }) {
  return (
    <span className={`${s.badge} ${s[`tone_${tone}`]} ${size === 'sm' ? s.badgeSm : ''}`}>
      <span className={s.badgeDot} aria-hidden="true" />
      {children}
    </span>
  );
}
