import seed from './seed.json';
import type {
  DomainSummary, KnowledgeEdge, KnowledgeGraph, KnowledgeLog, KnowledgeNode, NodeDetail, Proposal,
} from '@/features/knowledge/model/types';
import { computeHealth, computePipeline } from '@/features/knowledge/model/rules';

/** 브라우저 메모리에 두는 Mock DB. 새로고침하면 초기 상태로 돌아간다. */
const nodes = seed.nodes as unknown as (KnowledgeNode & { seed: number })[];
const edges = seed.edges as KnowledgeEdge[];
let proposals: Proposal[] = structuredClone(seed.proposals) as Proposal[];
let logs: KnowledgeLog[] = structuredClone(seed.logs) as KnowledgeLog[];
let logSeq = 900;

const APPLY_AT = '2026-10-03T02:00:00+09:00';

function domains(): DomainSummary[] {
  return seed.hubs.map((h) => {
    const mine = nodes.filter((n) => n.domain === h.key && typeof n.impact === 'number');
    const avg = (f: (n: KnowledgeNode) => number) => mine.reduce((a, n) => a + f(n), 0) / Math.max(1, mine.length);
    return {
      key: h.key as DomainSummary['key'],
      label: h.label,
      count: h.count,
      position: h.position,
      avgImpact: Math.round(avg((n) => n.impact ?? 0) * 10) / 10,
      avgFreshness: Math.round(avg((n) => n.freshness ?? 0)),
    };
  });
}

export const db = {
  graph(): KnowledgeGraph {
    return {
      agent: seed.agent as KnowledgeGraph['agent'],
      meta: seed.meta,
      domains: domains(),
      nodes: nodes.map(({ seed: _s, ...n }) => n),
      edges,
    };
  },

  node(id: string): NodeDetail | undefined {
    const n = nodes.find((x) => x.id === id);
    if (!n) return undefined;
    const { seed: s, ...rest } = n;
    const trend = n.status === 'keep' ? 0.9 : n.status === 'watch' ? -0.3 : -0.9;
    const base = new Date('2026-09-03T00:00:00+09:00').getTime();
    const impactSeries = Array.from({ length: 30 }, (_, i) => {
      const v = 0.5 + trend * (i / 29 - 0.5) * 0.55 + Math.sin(s * 13 + i * 1.7) * 0.08 + Math.sin(s * 7 + i * 0.6) * 0.05;
      return { t: new Date(base + i * 864e5).toISOString().slice(0, 10), v: Math.max(0.12, Math.min(0.9, v)) };
    });
    return { ...rest, impactSeries };
  },

  health() {
    return computeHealth(seed.health.base, seed.health.deltaToday, seed.health.delta30d, proposals);
  },

  pipeline() {
    return computePipeline(seed.meta.totalKnowledge, proposals);
  },

  proposals(decision?: string | null) {
    return decision ? proposals.filter((p) => p.decision === decision) : proposals;
  },

  logs(cursor: string | null, limit: number) {
    const start = cursor ? Number(cursor) : 0;
    const items = logs.slice(start, start + limit);
    const next = start + limit < logs.length ? String(start + limit) : null;
    return { items, nextCursor: next };
  },

  decide(id: string, decision: 'approved' | 'deferred', actor = 'int') {
    const p = proposals.find((x) => x.id === id);
    if (!p) return { error: 404 as const };
    if (p.decision !== 'pending') return { error: 409 as const };
    const node = nodes.find((n) => n.id === p.nodeId)!;
    const now = new Date().toISOString();
    const updated: Proposal = {
      ...p,
      decision,
      decidedBy: actor,
      decidedAt: now,
      ...(decision === 'approved'
        ? { applyAt: APPLY_AT }
        : { resurfaceAt: new Date(Date.now() + 7 * 864e5).toISOString() }),
    };
    proposals = proposals.map((x) => (x.id === id ? updated : x));
    const kindLabel = p.kind === 'learn' ? 'Learning' : 'Unlearning';
    const log: KnowledgeLog = decision === 'approved'
      ? { id: `lg_${logSeq++}`, at: now, tag: 'APPROVE', message: `사용자 승인 · ${node.label} ${kindLabel} (승인자: ${actor})`, actor }
      : { id: `lg_${logSeq++}`, at: now, tag: 'DEFER', message: `제안 보류 · ${node.label} (7일 후 재제안)`, actor };
    logs = [log, ...logs];
    return { result: { proposal: updated, health: this.health(), pipeline: this.pipeline(), log } };
  },

  undo(id: string, actor = 'int') {
    const p = proposals.find((x) => x.id === id);
    if (!p) return { error: 404 as const };
    if (p.decision === 'pending') return { error: 409 as const };
    const node = nodes.find((n) => n.id === p.nodeId)!;
    const updated: Proposal = { id: p.id, nodeId: p.nodeId, kind: p.kind, question: p.question, expectedGain: p.expectedGain, createdAt: p.createdAt, decision: 'pending' };
    proposals = proposals.map((x) => (x.id === id ? updated : x));
    const log: KnowledgeLog = { id: `lg_${logSeq++}`, at: new Date().toISOString(), tag: 'UNDO', message: `결정 되돌림 · ${node.label}`, actor };
    logs = [log, ...logs];
    return { result: { proposal: updated, health: this.health(), pipeline: this.pipeline(), log } };
  },
};
