import { useState } from 'react';
import { IconCalendar, IconFolder, IconGear, IconGraph, IconGrid, IconHistory, IconMenu, IconPulse, IconShield, IconUsers } from './Icons';
import s from './shell.module.css';

const NAV = [
  { group: 'OBSERVABILITY', items: [
    { label: 'Overview', icon: <IconGrid />, href: '#' },
    { label: 'Projects', icon: <IconFolder />, href: '#' },
    { label: 'Live Pipelines', icon: <IconPulse />, href: '#' },
  ] },
  { group: 'KNOWLEDGE', items: [
    { label: 'Knowledge Graph', icon: <IconGraph />, href: '#top', active: true },
    { label: 'Learning 이력', icon: <IconHistory />, href: '#log' },
  ] },
  { group: 'ADMINISTRATION', items: [
    { label: '계정 관리', icon: <IconUsers />, href: '#' },
    { label: '권한 / 정책', icon: <IconShield />, href: '#' },
    { label: '설정', icon: <IconGear />, href: '#' },
  ] },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.root} id="top">
      <nav className={`${s.sidebar} ${open ? s.sidebarOpen : ''}`} aria-label="주 메뉴">
        <div className={s.logo}>
          <span className={s.logoMark}>turing<span className={s.logoDot}>.</span></span>
          <span className={s.logoSub}>CONSOLE</span>
        </div>
        {NAV.map((g) => (
          <div key={g.group} className={s.group}>
            <div className={s.groupLabel}>{g.group}</div>
            {g.items.map((it) => (
              <a key={it.label} href={it.href} className={`${s.navItem} ${'active' in it && it.active ? s.navActive : ''}`}
                 aria-current={'active' in it && it.active ? 'page' : undefined} onClick={() => setOpen(false)}>
                {it.icon}<span className={s.navLabel}>{it.label}</span>
                {'active' in it && it.active ? <span className={s.navChevron} aria-hidden="true">›</span> : null}
              </a>
            ))}
          </div>
        ))}
        <div className={s.spacer} />
        <div className={s.user}>
          <span className={s.avatar}>i</span>
          <span className={s.userMeta}><span className={s.userName}>int</span><span className={s.userRole}>ROOT</span></span>
        </div>
      </nav>
      {open ? <button type="button" className={s.scrim} aria-label="메뉴 닫기" onClick={() => setOpen(false)} /> : null}
      <main className={s.main}>
        <div className={s.topbar}>
          <div className={s.topLeft}>
            <button type="button" className={s.menuBtn} aria-label="메뉴 열기" onClick={() => setOpen(true)}><IconMenu size={20} /></button>
            <a href="#" className={s.back}><span aria-hidden="true">‹</span>서비스 운영 상황</a>
          </div>
          <button type="button" className={s.period}><IconCalendar />최근 30일<span aria-hidden="true" className={s.caret}>⌄</span></button>
        </div>
        {children}
      </main>
    </div>
  );
}
