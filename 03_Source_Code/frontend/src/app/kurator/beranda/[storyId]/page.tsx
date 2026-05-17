"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import CuratorServices from "@/services/curator.services";
import { IStoryDetailCurator } from "@/types/curator.types";
import { showSwalError } from "@/components/utils/alert.utils";

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const storyId = Number(params.storyId);

  const [storyDetail, setStoryDetail] = useState<IStoryDetailCurator | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [reason, setReason] = useState("");

  const fetchStoryDetail = async () => {
    const response = await CuratorServices.GetStoryDetail(storyId, dispatch);
    if (response.success) {
      setStoryDetail(response.data);
    }
  };

  useEffect(() => {
    fetchStoryDetail();
  }, [storyId, dispatch]);

  const handleApprove = async () => {
    const response = await CuratorServices.ApproveRejectStory(
      storyId,
      {
        status: "ACCEPTED",
        reason: reason || "Bacaan telah disetujui oleh kurator.",
      },
      dispatch
    );

    if (response.success) {
      setShowApproveModal(false);
      setReason("");
      router.push("/kurator/beranda");
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      showSwalError("Alasan penolakan harus diisi!");
      return;
    }

    const response = await CuratorServices.ApproveRejectStory(
      storyId,
      {
        status: "REJECTED",
        reason: reason,
      },
      dispatch
    );

    if (response.success) {
      setShowRejectModal(false);
      setReason("");
      router.push("/kurator/beranda");
    }
  };

  if (!storyDetail) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-[#8A5B3D]">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="mx-auto flex h-full max-w-4xl flex-col px-4 py-6 md:px-6">
        <div className="mb-4">
          <button onClick={() => router.push("/kurator/beranda")} className="mb-2 text-xs text-[#DE954F] hover:underline">
            ← Kembali ke Beranda
          </button>
          <h1 className="text-xl font-semibold text-[#4A2C19]">Detail Bacaan</h1>
          <p className="mt-1 text-xs text-[#8A5B3D]">Tinjau bacaan sebelum memberikan persetujuan</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-md border border-[#DE954F] bg-[#FFF8EC]">
                <img src={storyDetail.imageUrl} alt={storyDetail.title} className="h-full w-full object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[#4A2C19]">{storyDetail.title}</h2>
                  <span className="rounded-xl bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">{storyDetail.status}</span>
                </div>
                <p className="mt-2 text-sm text-[#8A5B3D]">{storyDetail.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-xl bg-[#DE954F]/10 px-3 py-1 text-xs font-medium text-[#DE954F]">{storyDetail.levelFullName}</span>
                </div>
                <div className="mt-3 text-xs text-[#8A5B3D]">
                  <div>Dibuat: {new Date(storyDetail.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  <div>Diperbarui: {new Date(storyDetail.updatedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Passage Card */}
          <div className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#4A2C19]">Passage</h3>
            <div className="mt-3 rounded-md border border-[#DE954F] bg-[#FFF8EC] p-4">
              <pre className="whitespace-pre-wrap text-sm text-[#4A2C19]">{storyDetail.passage}</pre>
            </div>
          </div>

          {/* Sentences Card */}
          <div className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#4A2C19]">Kalimat ({storyDetail.sentences.length})</h3>
            <div className="mt-3 space-y-2">
              {storyDetail.sentences.map((sentence, index) => (
                <div key={index} className="rounded-md border border-[#DE954F] bg-[#FFF8EC] p-3">
                  <span className="text-xs font-medium text-[#B07A4A]">#{index + 1}</span>
                  <p className="mt-1 text-sm text-[#4A2C19]">{sentence}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Logs Card */}
          {storyDetail.approvalLogs.length > 0 && (
            <div className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#4A2C19]">Riwayat Perubahan ({storyDetail.approvalLogs.length})</h3>
                <button onClick={() => setShowLogsModal(true)} className="text-xs text-[#DE954F] hover:underline">
                  Lihat Semua
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {storyDetail.approvalLogs
                  .slice(0, 2)
                  .reverse()
                  .map((log) => (
                    <div key={log.id} className="rounded-md border border-[#DE954F] bg-[#FFF8EC] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-xl px-2 py-1 text-xs font-medium ${log.toStatus === "ACCEPTED" ? "bg-green-100 text-green-700" : log.toStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {log.fromStatus} → {log.toStatus}
                        </span>
                        <span className="text-xs text-[#8A5B3D]">{new Date(log.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                      {log.reason && <p className="mt-2 text-xs text-[#4A2C19]">{log.reason}</p>}
                      {log.curatorName && <p className="mt-1 text-xs text-[#8A5B3D]">Oleh: {log.curatorName}</p>}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {storyDetail.status === "WAITING" && (
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(true)} className="flex-1 rounded-xl border-2 border-red-500 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50">
                Tolak Bacaan
              </button>
              <button onClick={() => setShowApproveModal(true)} className="flex-1 rounded-xl bg-[#DE954F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#c57833]">
                Setujui Bacaan
              </button>
            </div>
          )}
        </div>

        {showApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-[#DE954F] bg-[#FFF8EC] p-6">
              <h2 className="text-lg font-semibold text-[#4A2C19]">Setujui Bacaan</h2>
              <p className="mt-2 text-sm text-[#8A5B3D]">Apakah Anda yakin ingin menyetujui bacaan {storyDetail.title}?</p>
              <div className="mt-4">
                <label className="text-xs font-medium text-[#4A2C19]">Catatan (Opsional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tambahkan catatan persetujuan..."
                  className="mt-1 w-full rounded-md border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19]"
                  rows={3}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setReason("");
                  }}
                  className="flex-1 rounded-xl border border-[#DE954F] px-4 py-2 text-sm font-semibold text-[#DE954F] hover:bg-[#FFF8EC]"
                >
                  Batal
                </button>
                <button onClick={handleApprove} className="flex-1 rounded-xl bg-[#DE954F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c57833]">
                  Setujui
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-red-500 bg-[#FFF8EC] p-6">
              <h2 className="text-lg font-semibold text-[#4A2C19]">Tolak Bacaan</h2>
              <p className="mt-2 text-sm text-[#8A5B3D]">Berikan alasan penolakan untuk bacaan {storyDetail.title}</p>
              <div className="mt-4">
                <label className="text-xs font-medium text-[#4A2C19]">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan..."
                  className="mt-1 w-full rounded-md border border-red-500 bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19]"
                  rows={4}
                  required
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setReason("");
                  }}
                  className="flex-1 rounded-xl border border-[#DE954F] px-4 py-2 text-sm font-semibold text-[#DE954F] hover:bg-[#FFF8EC]"
                >
                  Batal
                </button>
                <button onClick={handleReject} className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                  Tolak
                </button>
              </div>
            </div>
          </div>
        )}

        {showLogsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-[#DE954F] bg-[#FFF8EC] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#4A2C19]">Riwayat Perubahan</h2>
                  <p className="mt-1 text-xs text-[#8A5B3D]">{storyDetail.title}</p>
                </div>
                <button onClick={() => setShowLogsModal(false)} className="rounded-xl p-1 hover:bg-[#F4D4AC]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4A2C19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-96 space-y-3 overflow-y-auto">
                {storyDetail.approvalLogs.length === 0 ? (
                  <div className="rounded-xl border border-[#F4D4AC] bg-[#FFF8EC] p-4 text-center text-xs text-[#8A5B3D]">Belum ada riwayat perubahan</div>
                ) : (
                  storyDetail.approvalLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <div key={log.id} className="rounded-xl border border-[#F4D4AC] bg-[#FFF8EC] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`rounded-xl px-2 py-1 text-xs font-medium ${log.toStatus === "ACCEPTED" ? "bg-green-100 text-green-700" : log.toStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                          >
                            {log.fromStatus} → {log.toStatus}
                          </span>
                          <span className="text-xs text-[#8A5B3D]">{new Date(log.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        {log.reason && (
                          <div className="mt-2 rounded-xl bg-[#FFF8EC] p-2">
                            <p className="text-xs font-medium text-[#4A2C19]">Alasan:</p>
                            <p className="mt-1 text-xs text-[#8A5B3D]">{log.reason}</p>
                          </div>
                        )}
                        {log.curatorName && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-[#8A5B3D]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Oleh: {log.curatorName}</span>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>

              <div className="mt-4">
                <button onClick={() => setShowLogsModal(false)} className="w-full rounded-xl bg-[#DE954F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c57833]">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
