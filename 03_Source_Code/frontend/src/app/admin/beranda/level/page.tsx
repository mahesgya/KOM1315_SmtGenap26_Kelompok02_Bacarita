"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import AdminServices from "@/services/admin.services";
import { IAdminOverview } from "@/types/admin.types";

const AdminLevelPage = () =>  {
  const dispatch = useDispatch();
  const [overview, setOverview] = useState<IAdminOverview | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      const response = await AdminServices.GetOverview(dispatch);
      if (response.success) {
        setOverview(response.data);
      }
    };
    fetchOverview();
  }, [dispatch]);

  if (!overview) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-[#8A5B3D]">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-6 md:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#4A2C19]">Kelola Level & Bacaan</h1>
            <p className="mt-1 text-xs text-[#8A5B3D] max-w-xl">Pilih level untuk mengelola bacaan di dalamnya</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {overview.levels
            .slice()
            .sort((a, b) => a.no - b.no)
            .map((level) => (
              <div key={level.id} className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
                <div className="mb-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Level {level.no}</div>
                  <h2 className="mt-1 text-lg font-semibold text-[#4A2C19]">{level.name}</h2>
                  <p className="mt-1 text-xs text-[#8A5B3D]">{level.fullName}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-2xl bg-[#DE954F]/10 px-2 py-1 text-xs font-medium text-[#DE954F]">{level.storyCount} bacaan</span>
                  </div>
                </div>
                <Link href={`/admin/beranda/level/${level.id}`} className="mt-4 block rounded-xl bg-[#DE954F] px-4 py-2 text-center text-xs font-semibold text-white hover:bg-[#c57833]">
                  Kelola Bacaan
                </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default AdminLevelPage;