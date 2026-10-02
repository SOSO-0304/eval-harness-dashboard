import s from './graph.module.css';

const Mark = ({ bg, glyph }: { bg: string; glyph: string }) => (
  <span className={s.legendMark} style={{ background: bg }} aria-hidden="true">{glyph}</span>
);

export function GraphLegend() {
  return (
    <div className={s.legend}>
      <div className={s.legendItems}>
        <span><Mark bg="var(--badge-unlearn)" glyph="−" />Unlearning 후보</span>
        <span><Mark bg="var(--badge-watch)" glyph="!" />검토</span>
        <span><Mark bg="var(--badge-learn)" glyph="+" />Learning 필요</span>
        <span><span className={s.legendHollow} aria-hidden="true" />점선: 아직 없는 지식</span>
      </div>
      <span>색: 지식 분야 · 크기: 영향도 · 분야 노드를 누르면 필터 · <span className={s.hintDesktop}>Ctrl/⌘+스크롤로 확대</span><span className={s.hintTouch}>끌어서 이동, 두 손가락으로 확대</span></span>
    </div>
  );
}
