"use client";

import { useState } from "react";
import Sidebar from "@/components/kurator/sidebar";
import { cn } from "@/lib/cn";
import { Menu } from "lucide-react";

const DashboardKuratorLayout = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  const handleToggle = () => setOpen((v) => !v);

  return (
    <div className="min-h-dvh bg-[#F2E3D1]">
      <div className={cn("flex transition-[margin] duration-300 ml-[35px] md:ml-[60px]", open && "md:ml-[300px]")}>
        {!open && (
          <div
            aria-hidden={open}
            className={cn(
              "px-1 pt-3 md:px-3 md:pt-6 fixed inset-y-0 left-0 z-40",
              "bg-[#Fff8ec] border-r-2 border-[#DE954F] shadow-md transition-all duration-300 ease-out", 
              open ? "opacity-0 -translate-y-1 pointer-events-none select-none" : "opacity-100 translate-y-0 pointer-events-auto"
            )}
          >
            <button
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
              className="inline-flex h-8 w-8 md:h-11 md:w-11 items-center justify-center
                     rounded-lg border-2 border-[#DE954F] bg-[#Fff8ec]
                     text-[#5a4631] shadow-md hover:shadow-lg transition-all
                     hover:scale-105 active:scale-95
                     focus:outline-none focus:ring-2 focus:ring-[#DE954F] focus:ring-offset-2 focus:ring-offset-[#F2E3D1]"
            >
              <Menu size={24} className="size-5 md:size-6" />
            </button>
          </div>
        )}

        <main className="verdana w-full p-4 md:p-6">{children}</main>
      </div>

      <Sidebar open={open} onClose={() => setOpen(false)} onToggle={handleToggle} />
    </div>
  );
}

export default DashboardKuratorLayout