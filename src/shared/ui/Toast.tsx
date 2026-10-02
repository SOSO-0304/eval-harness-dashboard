import { useEffect } from 'react';
import { useUiStore } from '@/features/knowledge/store/uiStore';
import s from './ui.module.css';

export function Toast() {
  const msg = useUiStore((st) => st.toast);
  const notify = useUiStore((st) => st.notify);
  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => notify(null), 5000);
    return () => window.clearTimeout(t);
  }, [msg, notify]);
  if (!msg) return null;
  return (
    <div className={s.toast} role="status" aria-live="polite">
      {msg}
      <button type="button" onClick={() => notify(null)}>닫기</button>
    </div>
  );
}
