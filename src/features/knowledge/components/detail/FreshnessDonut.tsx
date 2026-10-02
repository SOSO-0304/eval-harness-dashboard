export function FreshnessDonut({ value, color, suffix = '' }: { value: number | null; color: string; suffix?: string }) {
  const C = 2 * Math.PI * 24;
  const v = value ?? 0;
  return (
    <svg width="52" height="52" viewBox="0 0 60 60" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border)" strokeWidth="6" />
      {value !== null ? (
        <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(C * v) / 100} ${C}`} transform="rotate(-90 30 30)" />
      ) : null}
      <text x="30" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-primary)">
        {value === null ? '–' : `${v}${suffix}`}
      </text>
    </svg>
  );
}
