"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import CuratorServices from "@/services/curator.services";
import { IWaitingStories } from "@/types/curator.types";

export default function KuratorBerandaPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [waitingStories, setWaitingStories] = useState<IWaitingStories | null>(null);

  const fetchWaitingStories = async () => {
    const response = await CuratorServices.GetWaitingStories(dispatch);
    if (response.success) {
      setWaitingStories(response.data);
    }
  };

  useEffect(() => {
    fetchWaitingStories();
  }, [dispatch]);

  if (!waitingStories) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-[#8A5B3D]">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-6 md:px-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-[#4A2C19]">Beranda Kurator</h1>
          <p className="mt-1 text-xs text-[#8A5B3D] max-w-xl">Tinjau dan setujui bacaan yang menunggu persetujuan untuk dipublikasikan.</p>
        </div>

        <div className="mb-4 rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Bacaan Menunggu Persetujuan</div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-3xl font-semibold text-[#4A2C19]">{waitingStories.totalWaiting}</div>
              <div className="mt-1 text-xs text-[#8A5B3D]">Total bacaan menunggu kurasi</div>
            </div>
          </div>
        </div>

        {waitingStories.stories.length === 0 ? (
          <div className="rounded-xl border border-[#F4D4AC] bg-[#FFF8EC] p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#DE954F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-[#4A2C19]">Tidak Ada Bacaan Menunggu</h3>
            <p className="mt-2 text-xs text-[#8A5B3D]">Semua bacaan sudah dikurasi. Silakan periksa kembali nanti.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {waitingStories.stories.map((story) => (
              <div key={story.id} className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-4 shadow-sm transition hover:shadow-md">
                <div className="relative h-32 w-full overflow-hidden rounded-md bg-[#FFF8EC]">
                  <img src={story.imageUrl} alt={story.title} className="h-full w-full object-contain" />
                </div>
                <div className="mt-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#4A2C19]">{story.title}</h3>
                    <span className="rounded-xl bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">{story.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#8A5B3D] line-clamp-2">{story.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-xl bg-[#DE954F]/10 px-2 py-1 text-[10px] font-medium text-[#DE954F]">{story.levelFullName}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-[#8A5B3D]">Tanggal Ajuan: {new Date(story.updatedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <button onClick={() => router.push(`/kurator/beranda/${story.id}`)} className="mt-3 w-full rounded-xl bg-[#DE954F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c57833]">
                    Tinjau Bacaan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
