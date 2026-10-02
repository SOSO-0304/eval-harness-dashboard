import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DomainKey, DomainSummary, GraphFilter, HealthScore, KnowledgeEdge, KnowledgeNode, Point, Proposal,
} from '../../model/types';
import { CORE_POS, GRAPH_H, GRAPH_W, domainColor, domainLabel } from '../../model/domains';
import {
  connectionCount, curvePath, effectiveStatus, isActionNode, isNodeDimmed, neighborsOf, nodeDiameter,
  signed, STATUS_BADGE, tooltipPlacement,
} from '../../model/rules';
import { GraphTooltip, type TooltipContent } from './GraphTooltip';
import s from './graph.module.css';

interface Props {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  domains: DomainSummary[];
  totalKnowledge: number;
  health?: HealthScore;
  proposalByNode: Map<string, Proposal>;
  selectedId: string | null;
  hoveredId: string | null;
  filter: GraphFilter;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onToggleDomain: (d: DomainKey) => void;
  onClearFilter: () => void;
}

const HUB = (d: DomainKey) => `hub:${d}`;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SMALL_LABEL_SCALE = 1.8;
const TOUCH_SMALL_SCALE = 1.5;
/** 이보다 좁은 화면에서는 그래프를 이 너비로 그리고 지도처럼 끌어서 본다 */
const MIN_LAYER_W = 620;

/** 상태별 노드 모양 */
function nodeLook(node: KnowledgeNode, proposal?: Proposal) {
  const color = domainColor(node.domain);
  const eff = effectiveStatus(node, proposal);
  const base = eff === 'deferred' ? node.status : eff;
  switch (base) {
    case 'watch': return { fill: color, border: '2px solid #fff', badge: { bg: 'var(--badge-watch)', glyph: '!' }, eff };
    case 'unlearn': return { fill: color, border: '2px solid #fff', badge: { bg: 'var(--badge-unlearn)', glyph: '−' }, eff };
    case 'learn': return { fill: '#fff', border: `2px dashed ${color}`, badge: { bg: 'var(--badge-learn)', glyph: '+' }, eff };
    case 'unlearnDone': return { fill: '#C9CDD8', border: '2px solid #fff', badge: { bg: 'var(--badge-done)', glyph: '✓' }, eff };
    case 'learnDone': return { fill: color, border: '2px solid #fff', badge: { bg: 'var(--badge-learn)', glyph: '✓' }, eff };
    default: return { fill: color, border: '2px solid #fff', badge: null, eff };
  }
}

export function GraphCanvas(props: Props) {
  const {
    nodes, edges, domains, totalKnowledge, health, proposalByNode, selectedId, hoveredId, filter,
    onSelect, onHover, onToggleDomain, onClearFilter,
  } = props;

  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: GRAPH_W, h: GRAPH_H });
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const userMoved = useRef(false);

  // 그래프 레이어 크기: 넓은 화면은 컨테이너에 꼭 맞추고, 좁은 화면은 최소 너비를 유지
  const layerW = Math.max(size.w, MIN_LAYER_W);
  const layerH = (layerW * GRAPH_H) / GRAPH_W;
  const fitView = useMemo(() => ({ s: 1, tx: (size.w - layerW) / 2, ty: (size.h - layerH) / 2 }), [size.w, size.h, layerW, layerH]);
  useEffect(() => { if (!userMoved.current) setView(fitView); }, [fitView]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startDist?: number; startView?: typeof view; panFrom?: { x: number; y: number; tx: number; ty: number }; moved?: boolean }>({});
  const lastPointerType = useRef<string>('mouse');

  // 컨테이너 크기 추적 (툴팁 위치 계산용)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- 위치 조회 ----------
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const posOf = useCallback((id: string): Point | null => {
    if (id === 'core') return CORE_POS;
    if (id.startsWith('hub:')) return domains.find((d) => HUB(d.key) === id)?.position ?? null;
    return byId.get(id)?.position ?? null;
  }, [byId, domains]);

  // ---------- 강조 대상 ----------
  const focusId = hoveredId ?? selectedId;
  const neighbors = useMemo(() => (hoveredId ? neighborsOf(hoveredId, edges) : new Set<string>()), [hoveredId, edges]);

  // ---------- 확대·이동 ----------
  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    userMoved.current = true;
    setView((v) => {
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.s * factor));
      const k = ns / v.s;
      return { s: ns, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k };
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // 페이지 스크롤을 빼앗지 않도록 Ctrl/⌘ + 휠(트랙패드 핀치 포함)일 때만 확대
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    lastPointerType.current = e.pointerType;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const isNode = (e.target as HTMLElement).closest('button');
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { startDist: Math.hypot(a.x - b.x, a.y - b.y), startView: view, moved: true };
    } else if (!isNode) {
      gesture.current = { panFrom: { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty }, moved: false };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size === 2 && g.startDist && g.startView) {
      const [a, b] = [...pointers.current.values()];
      const r = viewportRef.current!.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - r.left;
      const cy = (a.y + b.y) / 2 - r.top;
      const sv = g.startView;
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, sv.s * (Math.hypot(a.x - b.x, a.y - b.y) / g.startDist)));
      const k = ns / sv.s;
      userMoved.current = true;
      setView({ s: ns, tx: cx - (cx - sv.tx) * k, ty: cy - (cy - sv.ty) * k });
    } else if (g.panFrom) {
      const dx = e.clientX - g.panFrom.x;
      const dy = e.clientY - g.panFrom.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) { g.moved = true; userMoved.current = true; }
      setView((v) => ({ ...v, tx: g.panFrom!.tx + dx, ty: g.panFrom!.ty + dy }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = {};
  };

  const zoomButton = (factor: number) => zoomAt(factor, size.w / 2, size.h / 2);
  const resetView = () => { userMoved.current = false; setView(fitView); };

  // 좌표 변환: 720×600 → 화면 px
  const toScreen = (p: Point) => ({
    x: (p.x / GRAPH_W) * layerW * view.s + view.tx,
    y: (p.y / GRAPH_H) * layerH * view.s + view.ty,
  });

  // ---------- 엣지 스타일 ----------
  const edgeStyle = (e: KnowledgeEdge, a: KnowledgeNode | undefined, b: KnowledgeNode | undefined) => {
    const touch = !!focusId && (e.source === focusId || e.target === focusId);
    const leaf = b ?? a;
    const small = (a && !a.isRepresentative) || (b && !b.isRepresentative);
    // 분야 허브끼리 잇는 고리(domain_ring)는 특정 분야에 속하지 않는다
    const dom: DomainKey | null = e.kind === 'domain_ring' ? null
      : leaf ? leaf.domain : e.target.startsWith('hub:') ? (e.target.slice(4) as DomainKey) : null;
    const crossDomain = !!(a && b && a.domain !== b.domain);
    const c = dom ? domainColor(dom) : '#04044A';
    let stroke = '#CDD1DD', width = 1.3, dash: string | undefined, opacity = 1;
    switch (e.kind) {
      case 'core': width = 1.6; break;
      case 'domain_ring': stroke = '#DADDE7'; dash = '2 6'; break;
      case 'conflict': stroke = '#E5484D'; dash = '4 4'; break;
      case 'gap': stroke = c; dash = '5 4'; break;
      default:
        if (small) { stroke = crossDomain ? '#C9CEDC' : c; width = 0.9; opacity = crossDomain ? 0.7 : 0.3; }
    }
    if (touch) {
      stroke = e.kind === 'conflict' ? '#E5484D' : e.kind === 'core' ? '#04044A' : e.kind === 'domain_ring' ? '#9AA0B5' : c;
      width = e.kind === 'domain_ring' ? 1.6 : small ? 2 : 2.4;
      opacity = 1;
    }
    const actionEdge = (a && isActionNode(a)) || (b && isActionNode(b));
    const dim = (hoveredId && !touch)
      || (filter && filter !== 'action' && dom !== filter)
      || (filter === 'action' && !actionEdge);
    if (dim) opacity = Math.min(opacity, 0.15);
    return { stroke, width, dash, opacity };
  };

  // ---------- 툴팁 ----------
  let tooltip: { content: TooltipContent; left: number; top: number } | null = null;
  if (hoveredId) {
    const p = posOf(hoveredId);
    if (p) {
      const sc = toScreen(p);
      const place = tooltipPlacement(p);
      const W = 236;
      let left = place.side === 'right' ? sc.x + 22 : sc.x - 22 - W;
      let top = place.lift === 'up' ? sc.y - 150 : sc.y - 24;
      left = Math.max(8, Math.min(size.w - W - 8, left));
      top = Math.max(8, Math.min(size.h - 140, top));
      let content: TooltipContent | null = null;
      const n = byId.get(hoveredId);
      if (n) {
        const eff = effectiveStatus(n, proposalByNode.get(n.id));
        const b = STATUS_BADGE[eff];
        content = {
          dot: domainColor(n.domain), eyebrow: `${domainLabel(n.domain)} · ${n.sourceLabel}`, title: n.label,
          badge: b,
          line: n.gap
            ? `관련 질의 ${n.gap.queries30d}건 · 미흡 판정 ${n.gap.failRate}% · 연관도 ${n.gap.relevance}%`
            : `영향도 ${signed(n.impact ?? 0)} · 최신성 ${n.freshness} · 참조 ${n.usage30d}회`,
          foot: `연결 ${connectionCount(n.id, edges)}개 · 클릭해서 선택`,
        };
      } else if (hoveredId.startsWith('hub:')) {
        const d = domains.find((x) => HUB(x.key) === hoveredId)!;
        const act = nodes.filter((x) => x.domain === d.key && isActionNode(x) && proposalByNode.get(x.id)?.decision === 'pending').length;
        content = {
          dot: domainColor(d.key), eyebrow: '지식 분야', title: d.label,
          badge: act ? { label: `조치 필요 ${act}건`, tone: 'poor' } : { label: '정상', tone: 'good' },
          line: `지식 ${d.count}건 · 평균 영향도 ${signed(d.avgImpact)} · 평균 최신성 ${d.avgFreshness}`,
          foot: filter === d.key ? '다시 누르면 필터 해제' : '클릭하면 이 분야만 보기',
        };
      } else if (hoveredId === 'core') {
        content = {
          dot: '#04044A', eyebrow: '에이전트', title: '동향 분석 에이전트', badge: { label: '동작 중', tone: 'good' },
          line: `보유 지식 ${totalKnowledge.toLocaleString('ko-KR')}건 · 지식 건강도 ${health?.score ?? '–'}`,
          foot: 'Knowledge Graph의 중심 · 클릭하면 필터 초기화',
        };
      }
      if (content) tooltip = { content, left, top };
    }
  }

  const pct = (p: Point) => ({ left: `${(p.x / GRAPH_W) * 100}%`, top: `${(p.y / GRAPH_H) * 100}%` });
  const smallNodes = nodes.filter((n) => !n.isRepresentative);
  const repNodes = nodes.filter((n) => n.isRepresentative);

  const handleSmallClick = (n: KnowledgeNode) => {
    if (gesture.current.moved) return;
    // 모바일: 축소 상태에서는 작은 노드를 바로 고르지 않고 그 위치로 확대한다(오선택 방지)
    if (lastPointerType.current === 'touch' && view.s < TOUCH_SMALL_SCALE) {
      const sc = toScreen(n.position);
      zoomAt(1.8 / view.s, sc.x, sc.y);
      return;
    }
    onSelect(n.id);
  };

  return (
    <div className={s.scroller}>
      <div
        ref={viewportRef}
        className={s.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') onHover(null); }}
      >
        <div className={s.layer} style={{ width: layerW, height: layerH, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})` }}>
          <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} preserveAspectRatio="none" className={s.edges} aria-hidden="true">
            {edges.map((e, i) => {
              const p1 = posOf(e.source);
              const p2 = posOf(e.target);
              if (!p1 || !p2) return null;
              const st = edgeStyle(e, byId.get(e.source), byId.get(e.target));
              return (
                <path key={e.id} d={curvePath(p1.x, p1.y, p2.x, p2.y, 0.14, i % 2 ? 1 : -1)} fill="none"
                  stroke={st.stroke} strokeWidth={st.width} strokeDasharray={st.dash} opacity={st.opacity}
                  strokeLinecap="round" vectorEffect="non-scaling-stroke" className={s.edge} />
              );
            })}
          </svg>

          {smallNodes.map((n) => {
            const d = nodeDiameter(n);
            const isSel = selectedId === n.id;
            const isHov = hoveredId === n.id;
            const dim = isNodeDimmed(n, filter, hoveredId, neighbors);
            const color = domainColor(n.domain);
            return (
              <button key={n.id} type="button" tabIndex={-1} className={s.dotBtn} style={{ ...pct(n.position), opacity: dim ? 0.22 : 0.9 }}
                aria-label={`${n.label}, ${domainLabel(n.domain)}, ${STATUS_BADGE[n.status].label}`}
                onClick={() => handleSmallClick(n)}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover(n.id); }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') onHover(null); }}>
                <span className={s.dot} style={{
                  width: d, height: d, background: color,
                  border: n.status === 'watch' ? '1.5px solid var(--badge-watch)' : undefined,
                  boxShadow: isSel ? '0 0 0 2px #fff, 0 0 0 4px var(--brand-navy)' : isHov ? `0 0 0 5px ${color}40` : undefined,
                }} />
                {view.s >= SMALL_LABEL_SCALE ? <span className={s.dotLabel} style={{ fontSize: 11 / view.s }}>{n.label}</span> : null}
              </button>
            );
          })}

          {domains.map((d) => {
            const c = domainColor(d.key);
            const on = filter === d.key;
            const hov = hoveredId === HUB(d.key);
            const dim = !!filter && filter !== 'action' && filter !== d.key;
            return (
              <button key={d.key} type="button" className={s.hub} style={{ ...pct(d.position), opacity: dim ? 0.3 : 1 }}
                aria-label={`${d.label} 분야, 지식 ${d.count}건. ${on ? '필터 해제' : '이 분야만 보기'}`} aria-pressed={on}
                onClick={() => { if (!gesture.current.moved) onToggleDomain(d.key); }}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover(HUB(d.key)); }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') onHover(null); }}
                onFocus={() => onHover(HUB(d.key))} onBlur={() => onHover(null)}>
                <span className={s.hubDot} style={{ background: c, boxShadow: on || hov ? `0 0 0 2px ${c}, 0 0 0 7px ${c}33` : `0 0 0 1px ${c}, 0 1px 3px rgba(14,18,32,.2)` }} />
                <span className={s.hubLabel}>{d.label} <span>{d.count}</span></span>
              </button>
            );
          })}

          <button type="button" className={s.core} style={pct(CORE_POS)} aria-label="동향 분석 에이전트. 필터 초기화"
            onClick={() => { if (!gesture.current.moved) onClearFilter(); }}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover('core'); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') onHover(null); }}
            onFocus={() => onHover('core')} onBlur={() => onHover(null)}>
            <span className={s.coreDot} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="2.5" /><circle cx="5" cy="6" r="1.6" /><circle cx="19" cy="6" r="1.6" /><circle cx="6" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" /><path d="M10 10.5 6.3 7.2M14 10.5l3.7-3.3M10.2 13.8 7.2 16.8M13.8 13.8l3 3" /></svg>
            </span>
            <span className={s.coreLabel}>동향 분석 에이전트</span>
          </button>

          {repNodes.map((n) => {
            const d = nodeDiameter(n);
            const look = nodeLook(n, proposalByNode.get(n.id));
            const isSel = selectedId === n.id;
            const isHov = hoveredId === n.id;
            const dim = isNodeDimmed(n, filter, hoveredId, neighbors);
            const color = domainColor(n.domain);
            return (
              <button key={n.id} type="button" className={s.repBtn}
                style={{ ...pct(n.position), marginTop: -d / 2, opacity: dim ? 0.2 : look.eff === 'unlearnDone' ? 0.6 : 1 }}
                aria-label={`${n.label}, ${domainLabel(n.domain)}, ${STATUS_BADGE[look.eff].label}`}
                aria-pressed={isSel}
                onClick={() => { if (!gesture.current.moved) onSelect(n.id); }}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover(n.id); }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') onHover(null); }}
                onFocus={() => onHover(n.id)} onBlur={() => onHover(null)}>
                <span className={s.repDot} style={{
                  width: d, height: d, background: look.fill, border: look.border,
                  boxShadow: isSel ? '0 0 0 3px #fff, 0 0 0 5px var(--brand-navy)' : isHov ? `0 0 0 6px ${color}33` : `0 0 0 1px ${color}, 0 1px 3px rgba(14,18,32,.18)`,
                }}>
                  {look.badge ? <span className={s.badge} style={{ background: look.badge.bg }}>{look.badge.glyph}</span> : null}
                </span>
                <span className={`${s.repLabel} ${isSel ? s.repLabelSel : ''} ${look.eff === 'unlearnDone' ? s.struck : ''}`}>{n.label}</span>
              </button>
            );
          })}
        </div>

        {tooltip ? <GraphTooltip content={tooltip.content} left={tooltip.left} top={tooltip.top} /> : null}

        <div className={s.zoom} role="group" aria-label="그래프 확대·축소">
          <button type="button" aria-label="축소" onClick={() => zoomButton(1 / 1.3)}>−</button>
          <button type="button" aria-label="확대" onClick={() => zoomButton(1.3)}>+</button>
          <button type="button" className={s.fit} onClick={resetView} disabled={view.s === fitView.s && view.tx === fitView.tx && view.ty === fitView.ty}>맞춤</button>
        </div>
      </div>
    </div>
  );
}
