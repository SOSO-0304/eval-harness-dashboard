import { create } from 'zustand';
import type { DomainKey, GraphFilter } from '../model/types';

const DOMAIN_KEYS: DomainKey[] = ['market', 'industry', 'policy', 'memory'];

function readFilterFromUrl(): GraphFilter {
  if (typeof window === 'undefined') return null;
  const f = new URLSearchParams(window.location.search).get('filter');
  if (f === 'action') return 'action';
  return DOMAIN_KEYS.includes(f as DomainKey) ? (f as DomainKey) : null;
}

function writeFilterToUrl(f: GraphFilter) {
  const url = new URL(window.location.href);
  if (f) url.searchParams.set('filter', f);
  else url.searchParams.delete('filter');
  window.history.replaceState(null, '', url);
}

interface UiState {
  selectedId: string | null;
  /** 사용자가 직접 선택을 바꿨는지 (첫 진입 기본 선택을 한 번만 적용하기 위해) */
  touched: boolean;
  hoveredId: string | null; // 지식 노드 id, 'hub:<domain>', 'core'
  filter: GraphFilter;
  listView: boolean;
  toast: string | null;
  select: (id: string | null) => void;
  initSelect: (id: string) => void;
  hover: (id: string | null) => void;
  setFilter: (f: GraphFilter) => void;
  toggleFilter: (f: Exclude<GraphFilter, null>) => void;
  setListView: (v: boolean) => void;
  notify: (msg: string | null) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  selectedId: null,
  touched: false,
  hoveredId: null,
  filter: readFilterFromUrl(),
  listView: false,
  toast: null,
  select: (id) => set({ selectedId: id, hoveredId: null, touched: true }),
  initSelect: (id) => { if (!get().touched && !get().selectedId) set({ selectedId: id }); },
  hover: (id) => set({ hoveredId: id }),
  setFilter: (f) => { writeFilterToUrl(f); set({ filter: f, hoveredId: null }); },
  toggleFilter: (f) => get().setFilter(get().filter === f ? null : f),
  setListView: (v) => set({ listView: v }),
  notify: (msg) => set({ toast: msg }),
}));
