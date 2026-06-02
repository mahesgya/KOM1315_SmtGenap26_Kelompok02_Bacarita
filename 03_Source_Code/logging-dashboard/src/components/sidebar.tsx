'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ScrollText, Globe, Wifi, LogOut } from 'lucide-react';

interface Props {
  lastRefreshLabel: string;
  onLogout: () => void;
}

const NAV = [
  { href: '/',          label: 'API Logs',  icon: <Globe size={16} />,      desc: 'All Events' },
  { href: '/auth-logs', label: 'Auth Logs', icon: <ScrollText size={16} />, desc: 'Authentication Events' },
];

export function Sidebar({ lastRefreshLabel, onLogout }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border)' }}>
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div>
          <p className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            Bacarita
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Security Logs
          </p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <div>
            <p className="text-xs font-medium text-emerald-400">API Connected</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Refresh {lastRefreshLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
              style={{
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                color: active ? '#818cf8' : 'var(--text-secondary)',
              }}
            >
              <span className={active ? 'text-indigo-400' : ''}>{item.icon}</span>
              <div>
                <p className="text-xs font-medium leading-none">{item.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2">
          <Wifi size={12} className="text-emerald-400" />
          <div>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Sistem Aktif
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              NestJS + MySQL
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover:opacity-80"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5',
          }}
        >
          <LogOut size={13} />
          <span className="text-xs font-medium">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
