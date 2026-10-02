import type {
  EffectiveStatus, Grade, GraphFilter, HealthScore, KnowledgeEdge, KnowledgeNode,
  PipelineStep, Proposal,
} from './types';
import { GRAPH_H, GRAPH_W } from './domains';

/** 건강도 등급: 85 이상 우수, 70~84 보통, 70 미만 미흡 */
export function gradeOf(score: number): Grade {
  if (score >= 85) return 'good';
  if (score >= 70) return 'fair';
  return 'poor';
}

export const GRADE_LABEL: Record<Grade, string> = { good: '우수', fair: '보통', poor: '미흡' };

/** 노드 등급(지표 카드 배지): keep→우수, watch→보통, unlearn·learn→미흡 */
export function nodeGrade(node: KnowledgeNode): Grade {
  if (node.status === 'keep') return 'good';
  if (node.status === 'watch') return 'fair';
  return 'poor';
}

/** 노드 지름(px) */
export function nodeDiameter(node: KnowledgeNode): number {
  const abs = Math.abs(node.impact ?? 0);
  if (node.isRepresentative) {
    if (node.status === 'learn') return 28;
    if (abs >= 12) return 30;
    if (abs >= 6) return 24;
    return 20;
  }
  return Math.round(((2 + abs * 0.45) * 2 + 1) * 10) / 10;
}

/** 최신성 도넛 색 등급 */
export function freshnessGrade(f: number): Grade {
  if (f >= 70) return 'good';
  if (f >= 40) return 'fair';
  return 'poor';
}

/** 노드 상태 + 제안 결정 → 화면 상태 */
export function effectiveStatus(node: KnowledgeNode, proposal?: Proposal): EffectiveStatus {
  if (!proposal || proposal.decision === 'pending') return node.status;
  if (proposal.decision === 'deferred') return 'deferred';
  return node.status === 'learn' ? 'learnDone' : 'unlearnDone';
}

export const STATUS_BADGE: Record<EffectiveStatus, { label: string; tone: 'good' | 'fair' | 'poor' | 'learn' | 'muted' }> = {
  keep: { label: '유지', tone: 'good' },
  watch: { label: '검토', tone: 'fair' },
  unlearn: { label: 'Unlearning 후보', tone: 'poor' },
  learn: { label: 'Learning 필요', tone: 'learn' },
  unlearnDone: { label: 'Unlearning 승인', tone: 'muted' },
  learnDone: { label: 'Learning 승인', tone: 'learn' },
  deferred: { label: '보류됨', tone: 'muted' },
};

export const isActionNode = (n: KnowledgeNode) => n.status === 'learn' || n.status === 'unlearn';

/** 건강도 재계산: 기준 점수 + 승인된 제안의 기대 효과 */
export function computeHealth(base: number, deltaToday: number, delta30d: number, proposals: Proposal[]): HealthScore {
  const gain = proposals.filter((p) => p.decision === 'approved').reduce((a, p) => a + p.expectedGain, 0);
  const max = proposals.reduce((a, p) => a + p.expectedGain, 0);
  const score = base + gain;
  return { score, grade: gradeOf(score), deltaToday: gain > 0 ? gain : deltaToday, delta30d, maxIfAllApplied: base + max };
}

export function computePipeline(totalKnowledge: number, proposals: Proposal[], applyLabel = '다음 반영 10.03 02:00'): PipelineStep[] {
  const pending = proposals.filter((p) => p.decision === 'pending').length;
  const allDone = pending === 0;
  return [
    { key: 'monitoring', state: 'done', summary: `지식·메모리 ${totalKnowledge.toLocaleString('ko-KR')}건 추적` },
    { key: 'detection', state: 'done', summary: `열화 연관 지식 ${proposals.length}건 탐지` },
    { key: 'proposal', state: 'done', summary: `제안 ${proposals.length}건 생성` },
    { key: 'approval', state: allDone ? 'done' : 'current', summary: allDone ? '모든 제안 검토 완료' : `승인 대기 ${pending}건` },
    { key: 'apply', state: allDone ? 'current' : 'upcoming', summary: applyLabel },
  ];
}

/** 필터·호버에 따라 흐리게 처리할지 */
export function isNodeDimmed(
  node: KnowledgeNode,
  filter: GraphFilter,
  hoveredId: string | null,
  neighbors: Set<string>,
): boolean {
  if (hoveredId && !neighbors.has(node.id)) return true;
  if (filter === 'action') return !isActionNode(node);
  if (filter) return node.domain !== filter;
  return false;
}

/** 인접 노드 집합 (자기 자신 포함) */
export function neighborsOf(id: string, edges: KnowledgeEdge[]): Set<string> {
  const s = new Set<string>([id]);
  for (const e of edges) {
    if (e.source === id) s.add(e.target);
    if (e.target === id) s.add(e.source);
  }
  return s;
}

export function connectionCount(id: string, edges: KnowledgeEdge[]): number {
  return edges.reduce((c, e) => c + (e.source === id || e.target === id ? 1 : 0), 0);
}

/** 툴팁 위치: 그래프 왼쪽 절반이면 오른쪽에, 오른쪽 절반이면 왼쪽에. 아래쪽 1/3이면 위로 */
export function tooltipPlacement(pos: { x: number; y: number }) {
  return {
    side: pos.x < GRAPH_W / 2 ? ('right' as const) : ('left' as const),
    lift: pos.y > (GRAPH_H * 2) / 3 ? ('up' as const) : ('down' as const),
  };
}

/** 2차 곡선 경로 (720×600 좌표계) */
export function curvePath(x1: number, y1: number, x2: number, y2: number, k = 0.14, sign = 1): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * k * sign;
  const cy = my + dx * k * sign;
  return `M ${x1} ${y1} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
}

export const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
