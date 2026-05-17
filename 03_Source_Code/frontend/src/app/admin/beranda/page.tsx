"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import AdminServices from "@/services/admin.services";
import { IAdminOverview } from "@/types/admin.types";

export default function AdminBerandaPage() {
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
            <h1 className="text-xl font-semibold text-[#4A2C19]">Beranda Admin</h1>
            <p className="mt-1 text-xs text-[#8A5B3D] max-w-xl">Pantau ringkasan level dan bacaan yang tersedia sebelum menambahkan materi baru.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Statistik Level</div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold text-[#4A2C19]">{overview.levelsCount}</div>
                <div className="mt-1 text-xs text-[#8A5B3D]">Level bacaan aktif</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Statistik Bacaan</div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold text-[#4A2C19]">{overview.storiesCount}</div>
                <div className="mt-1 text-xs text-[#8A5B3D]">Total bacaan pada semua level</div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}
