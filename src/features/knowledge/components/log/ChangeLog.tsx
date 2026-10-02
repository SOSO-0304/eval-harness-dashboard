import type { KnowledgeLog } from '../../model/types';
import s from '../page.module.css';

const fmt = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function ChangeLog({ logs, hasMore, onMore, loadingMore }: { logs: KnowledgeLog[]; hasMore: boolean; onMore: () => void; loadingMore: boolean }) {
  return (
    <section className={s.logSection} aria-label="지식 변경 이력" id="log">
      <div className={s.logHead}>
        <h2 className={s.cardTitle}>지식 변경 이력</h2>
        <span className={s.overline}>LEARNING · UNLEARNING LOG</span>
      </div>
      <div className={`${s.card} ${s.logBox}`}>
        <ol className={s.logList}>
          {logs.map((l) => (
            <li key={l.id} className={s.logRow}>
              <span className={s.logTime}>[{fmt(l.at)}]</span>
              <span className={`${s.logTag} ${s[`tag_${l.tag}`]}`}>{l.tag}</span>
              <span>{l.message}</span>
            </li>
          ))}
        </ol>
        {hasMore ? (
          <button type="button" className={s.moreBtn} onClick={onMore} disabled={loadingMore}>{loadingMore ? '불러오는 중' : '이력 더 보기'}</button>
        ) : null}
      </div>
    </section>
  );
}
