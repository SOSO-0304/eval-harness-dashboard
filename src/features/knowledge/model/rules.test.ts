import { describe, expect, it } from 'vitest';
import { computeHealth, computePipeline, gradeOf, nodeDiameter, tooltipPlacement, effectiveStatus } from './rules';
import type { KnowledgeNode, Proposal } from './types';

const node = (over: Partial<KnowledgeNode>): KnowledgeNode => ({
  id: 'n', label: 'n', domain: 'market', sourceType: 'news', sourceLabel: '뉴스', status: 'keep',
  isRepresentative: true, impact: 0, freshness: 80, usage30d: 1, addedAt: null, reason: '', position: { x: 0, y: 0 }, related: [],
  ...over,
});
const prop = (decision: Proposal['decision'], gain: number): Proposal => ({
  id: 'p' + gain, nodeId: 'n', kind: 'unlearn', question: '', expectedGain: gain, decision, createdAt: '',
});

describe('rules', () => {
  it('건강도 등급 경계값', () => {
    expect(gradeOf(85)).toBe('good');
    expect(gradeOf(84)).toBe('fair');
    expect(gradeOf(70)).toBe('fair');
    expect(gradeOf(69)).toBe('poor');
  });
  it('대표 노드 지름', () => {
    expect(nodeDiameter(node({ impact: -12 }))).toBe(30);
    expect(nodeDiameter(node({ impact: 7 }))).toBe(24);
    expect(nodeDiameter(node({ impact: 2 }))).toBe(20);
    expect(nodeDiameter(node({ status: 'learn', impact: null }))).toBe(28);
  });
  it('일반 노드 지름은 영향도에 비례', () => {
    expect(nodeDiameter(node({ isRepresentative: false, impact: 0 }))).toBe(5);
    expect(nodeDiameter(node({ isRepresentative: false, impact: 6 }))).toBeCloseTo(10.4);
  });
  it('승인 시 건강도 = 기준 + 기대 효과', () => {
    const h = computeHealth(72, -3, -8, [prop('approved', 4), prop('pending', 5)]);
    expect(h.score).toBe(76);
    expect(h.deltaToday).toBe(4);
    expect(h.maxIfAllApplied).toBe(81);
  });
  it('모든 제안이 결정되면 4단계 완료, 5단계 진행', () => {
    const steps = computePipeline(1284, [prop('approved', 1), prop('deferred', 2)]);
    expect(steps[3].state).toBe('done');
    expect(steps[4].state).toBe('current');
  });
  it('툴팁 위치', () => {
    expect(tooltipPlacement({ x: 100, y: 100 })).toEqual({ side: 'right', lift: 'down' });
    expect(tooltipPlacement({ x: 600, y: 550 })).toEqual({ side: 'left', lift: 'up' });
  });
  it('제안 결정에 따른 화면 상태', () => {
    expect(effectiveStatus(node({ status: 'unlearn' }), prop('approved', 1))).toBe('unlearnDone');
    expect(effectiveStatus(node({ status: 'learn' }), prop('approved', 1))).toBe('learnDone');
    expect(effectiveStatus(node({ status: 'unlearn' }), prop('deferred', 1))).toBe('deferred');
  });
});
