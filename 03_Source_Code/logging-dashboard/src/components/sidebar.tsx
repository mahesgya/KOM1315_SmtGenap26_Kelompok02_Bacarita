"use client";

import { usePathname, useRouter } from "next/navigation";
import { ScrollText, Globe, Wifi, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props {
  lastRefreshLabel: string;
  onLogout: () => void;
}

const NAV = [
  { href: "/",          label: "API Logs",  Icon: Globe,       desc: "All Events" },
  { href: "/auth-logs", label: "Auth Logs", Icon: ScrollText,  desc: "Authentication Events" },
];

export function Sidebar({ lastRefreshLabel, onLogout }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full bg-sidebar border-r border-border">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border">
        <div>
          <p className="text-sm font-bold leading-none text-sidebar-foreground">Bacarita</p>
          <p className="text-[10px] mt-0.5 text-muted-foreground">Security Logs</p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <div>
            <p className="text-xs font-medium text-emerald-500">API Connected</p>
            <p className="text-[10px] text-muted-foreground">Refresh {lastRefreshLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        {NAV.map(({ href, label, Icon, desc }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all border",
                active
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
              )}
            >
              <Icon size={16} />
              <div>
                <p className="text-xs font-medium leading-none">{label}</p>
                <p className="text-[10px] mt-0.5 text-muted-foreground">{desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={12} className="text-emerald-500" />
            <div>
              <p className="text-[11px] font-medium text-foreground">Sistem Aktif</p>
              <p className="text-[10px] text-muted-foreground">NestJS + MySQL</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onLogout}
          className="w-full gap-2 justify-start"
        >
          <LogOut size={13} />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
