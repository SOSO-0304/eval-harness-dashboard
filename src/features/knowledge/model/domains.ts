import type { DomainKey } from './types';

export const DOMAINS: { key: DomainKey; label: string; color: string; cssVar: string }[] = [
  { key: 'market', label: '시장 데이터', color: '#5DA82E', cssVar: 'var(--domain-market)' },
  { key: 'industry', label: '기업·산업 동향', color: '#1A9FC0', cssVar: 'var(--domain-industry)' },
  { key: 'policy', label: '정책·규제', color: '#B348B8', cssVar: 'var(--domain-policy)' },
  { key: 'memory', label: '사용자 메모리', color: '#5B6CF0', cssVar: 'var(--domain-memory)' },
];

export const domainColor = (key: DomainKey): string => DOMAINS.find((d) => d.key === key)!.color;
export const domainLabel = (key: DomainKey): string => DOMAINS.find((d) => d.key === key)!.label;

/** 그래프 좌표계 (레이아웃 결과가 이 크기로 정규화되어 내려온다) */
export const GRAPH_W = 720;
export const GRAPH_H = 600;
export const CORE_POS = { x: 360, y: 300 };
