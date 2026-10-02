export type DomainKey = 'market' | 'industry' | 'policy' | 'memory';
export type KnowledgeStatus = 'keep' | 'watch' | 'unlearn' | 'learn';
export type SourceType =
  | 'external_report' | 'data_feed' | 'news' | 'disclosure'
  | 'official_doc' | 'internal_doc' | 'conversation_memory' | 'gap';
export type Grade = 'good' | 'fair' | 'poor';

export interface Point { x: number; y: number }

export interface LearnSource { id: string; kind: string; title: string }

export interface KnowledgeNode {
  id: string;
  label: string;
  domain: DomainKey;
  sourceType: SourceType;
  sourceLabel: string;
  status: KnowledgeStatus;
  isRepresentative: boolean;
  impact: number | null;
  freshness: number | null;
  usage30d: number | null;
  addedAt: string | null;
  reason: string;
  position: Point; // 720×600 좌표계
  related: { id: string; relation: 'related' | 'conflict' }[];
  gap?: { queries30d: number; failRate: number; relevance: number; sources: LearnSource[] };
  proposalId?: string;
}

export type EdgeKind = 'core' | 'domain_ring' | 'membership' | 'relation' | 'conflict' | 'gap';
export interface KnowledgeEdge { id: string; source: string; target: string; kind: EdgeKind; weight?: number }

export interface DomainSummary {
  key: DomainKey;
  label: string;
  count: number;
  avgImpact: number;
  avgFreshness: number;
  position: Point;
}

export interface GraphMeta { totalKnowledge: number; nodeCount: number; edgeCount: number; layoutVersion: string }

export interface AgentInfo { id: string; name: string; description: string; status: 'running' | 'stopped'; os: string }

export interface KnowledgeGraph {
  agent: AgentInfo;
  meta: GraphMeta;
  domains: DomainSummary[];
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export type ProposalKind = 'learn' | 'unlearn';
export type ProposalDecision = 'pending' | 'approved' | 'deferred';
export interface Proposal {
  id: string;
  nodeId: string;
  kind: ProposalKind;
  question: string;
  expectedGain: number;
  decision: ProposalDecision;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  applyAt?: string;
  resurfaceAt?: string;
}

export interface HealthScore {
  score: number;
  grade: Grade;
  deltaToday: number;
  delta30d: number;
  maxIfAllApplied: number;
}

export type PipelineStepKey = 'monitoring' | 'detection' | 'proposal' | 'approval' | 'apply';
export interface PipelineStep { key: PipelineStepKey; state: 'done' | 'current' | 'upcoming'; summary: string }

export type LogTag = 'DETECT' | 'PROPOSE' | 'APPROVE' | 'DEFER' | 'UNDO' | 'LEARN' | 'UNLEARN';
export interface KnowledgeLog { id: string; at: string; tag: LogTag; message: string; actor?: string }
export interface LogPage { items: KnowledgeLog[]; nextCursor: string | null }

export interface ImpactPoint { t: string; v: number }
export interface NodeDetail extends KnowledgeNode { impactSeries: ImpactPoint[] }

export interface DecisionResult {
  proposal: Proposal;
  health: HealthScore;
  pipeline: PipelineStep[];
  log: KnowledgeLog;
}

/** 화면에서 쓰는 '현재 상태' — 노드 상태 + 제안 결정을 합친 값 */
export type EffectiveStatus = KnowledgeStatus | 'unlearnDone' | 'learnDone' | 'deferred';

export type GraphFilter = DomainKey | 'action' | null;
