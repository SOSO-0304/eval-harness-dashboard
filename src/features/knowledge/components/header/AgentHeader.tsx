import { IconWindows } from '@/shared/ui/Icons';
import type { AgentInfo } from '../../model/types';
import s from '../page.module.css';

export function AgentHeader({ agent, totalKnowledge, pendingCount }: { agent?: AgentInfo; totalKnowledge?: number; pendingCount: number }) {
  return (
    <header className={s.header}>
      <div className={s.headerMain}>
        <div className={s.titleRow}>
          <h1 className={s.title}>{agent?.name ?? '에이전트'}</h1>
          {agent ? <span className={s.runBadge}>{agent.status === 'running' ? '동작 중' : '동작 중지'}</span> : null}
        </div>
        <div className={s.subtitle}>
          <IconWindows />
          <span>{agent?.description ?? ''}</span>
          <span className={s.sep} aria-hidden="true">|</span>
          <span className={s.subStrong}>Knowledge Management</span>
        </div>
      </div>
      <dl className={s.stats}>
        <div className={s.stat}><dt>보유 KNOWLEDGE</dt><dd>{totalKnowledge?.toLocaleString('ko-KR') ?? '–'}</dd></div>
        <div className={s.stat}><dt>승인 대기 PROPOSALS</dt><dd>{pendingCount}</dd></div>
      </dl>
    </header>
  );
}
