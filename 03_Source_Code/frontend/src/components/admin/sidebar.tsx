"use client";

import { type FC, JSX, memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { User2, X } from "lucide-react";
import { showToastError, showToastSuccess } from "../utils/toast.utils";
import { useRouter } from "next/navigation";
import { ProfileCard } from "../ui/profile.card";
import { AdminProfilePayload } from "@/types/auth.types";
import LogoutServices from "@/services/logout.services";
import { useDispatch } from "react-redux";
import AuthServices from "@/services/auth.services";
export type NavItem = { label: string; href: string; icon?: JSX.Element };

const navItems: NavItem[] = [
  { label: "Beranda", href: "/admin/beranda" },
  { label: "Level", href: "/admin/beranda/level" },
];

type SidebarProps = { open: boolean; onClose: () => void; onToggle: () => void };

const Sidebar: FC<SidebarProps> = ({ open, onClose, onToggle }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [panelOpen, setPanelOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfilePayload>();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await LogoutServices.LogoutAdmin(dispatch);
    router.push("/");
    showToastSuccess("Logout Berhasil!");
  };

  useEffect(() => {
    const fetchData = async () => {
      const responseProfile = await AuthServices.GetProfileAdmin(dispatch);

      if (responseProfile.success) {
        setProfile(responseProfile.data);
      } else {
        showToastError(responseProfile.error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      setPanelOpen(false);
    };
    if (panelOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [panelOpen]);

  return (
    <>
      <div onClick={onClose} className={cn("fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-30 md:hidden", open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")} />

      <aside
        className={cn(
          "verdana fixed inset-y-0 left-0 z-40",
          "w-[85%] max-w-sm md:w-[305px] shrink-0",
          "bg-[#FFF8EC] backdrop-blur",
          "border-r-2 border-[#DE954F] rounded-none md:rounded-r-3xl",
          "shadow-2xl md:shadow-lg",
          "p-6 md:p-8",
          "transition-transform duration-300 will-change-transform",
          "flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
          "overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black text-[#5a4631] tracking-tight">Dashboard</h1>
            <p className="text-sm text-[#5a4631] opacity-60 font-medium">Admin</p>
          </div>
          <button
            onClick={onToggle}
            className={cn("flex items-center justify-center h-10 w-10", "shadow-sm rounded-full border-2 border-[#DE954F]", "bg-[#FFF8EC]", "transition-all duration-300 ease-out", "hover:shadow-md active:scale-95", "text-[#5a4631]")}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item, idx) => {
            const active = item.href === "/admin/beranda" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-4 py-3",
                  "text-[#5a4631] font-semibold transition-all duration-300",
                  "group overflow-hidden",
                  active ? "bg-[#DE954F] text-white shadow-lg" : "hover:bg-[#EDD1B0] text-[#5a4631]"
                )}
              >
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-10 left-0 right-0 px-2 z-20" ref={panelRef}>
          <div className={cn("transition-all duration-200 origin-bottom", panelOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none")}>
            <div className="relative">
              <ProfileCard role="admin" profile={profile} handleLogout={handleLogout} />
            </div>
          </div>
          <div className={`flex mt-2 justify-center`}>
            <button
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((v) => !v)}
              className={`bg-[#FFF8EC] text-[#513723] shadow-md grid place-items-center active:scale-[0.98] transition border border-[#DE954F] ${panelOpen ? "rounded-xl p-4 " : "rounded-xl p-4"}`}
            >
              {panelOpen ? (
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5" />
                  <p className="text-sm">Tutup</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4" />
                  <p className="text-sm">Admin Bacarita</p>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default memo(Sidebar);
