import type { ImpactPoint } from '../../model/types';

export function Sparkline({ points, stroke, fill }: { points: ImpactPoint[]; stroke: string; fill: string }) {
  if (points.length < 2) return <div style={{ height: 44 }} />;
  const W = 280, H = 44;
  const xy = points.map((p, i) => [(i * W) / (points.length - 1), H - p.v * 40] as const);
  const line = 'M ' + xy.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} aria-hidden="true" style={{ display: 'block' }}>
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
