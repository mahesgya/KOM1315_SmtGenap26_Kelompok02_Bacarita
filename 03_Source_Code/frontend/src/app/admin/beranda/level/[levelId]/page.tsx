"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import AdminServices from "@/services/admin.services";
import { ILevelDetail, IStoryAdmin, IUpdateStoryRequest } from "@/types/admin.types";

export default function LevelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const levelId = Number(params.levelId);

  const [levelDetail, setLevelDetail] = useState<ILevelDetail | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<IStoryAdmin | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    passage: "",
    imageCover: null as File | null,
  });

  const fetchLevelDetail = async () => {
    const response = await AdminServices.GetStoriesByLevel(levelId, dispatch);
    if (response.success) {
      setLevelDetail(response.data);
    }
  };

  useEffect(() => {
    fetchLevelDetail();
  }, [levelId, dispatch]);

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageCover) return;

    const response = await AdminServices.CreateStory(
      levelId,
      {
        title: formData.title,
        description: formData.description,
        passage: formData.passage,
        imageCover: formData.imageCover,
      },
      dispatch
    );

    if (response.success) {
      setShowCreateModal(false);
      setFormData({ title: "", description: "", passage: "", imageCover: null });
      fetchLevelDetail();
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory) return;

    const updatePayload: IUpdateStoryRequest = {};
    if (formData.title) updatePayload.title = formData.title;
    if (formData.description) updatePayload.description = formData.description;
    if (formData.passage) updatePayload.passage = formData.passage;
    if (formData.imageCover) updatePayload.imageCover = formData.imageCover;

    const response = await AdminServices.UpdateStory(selectedStory.id, updatePayload, dispatch);

    if (response.success) {
      setShowEditModal(false);
      setSelectedStory(null);
      setFormData({ title: "", description: "", passage: "", imageCover: null });
      fetchLevelDetail();
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    if (!confirm("Yakin ingin menghapus bacaan ini?")) return;

    const response = await AdminServices.DeleteStory(storyId, dispatch);
    if (response.success) {
      fetchLevelDetail();
    }
  };

  const openEditModal = (story: IStoryAdmin) => {
    setSelectedStory(story);
    setFormData({
      title: story.title,
      description: story.description,
      passage: story.passage,
      imageCover: null,
    });
    setShowEditModal(true);
  };

  const openLogsModal = (story: IStoryAdmin) => {
    setSelectedStory(story);
    setShowLogsModal(true);
  };

  if (!levelDetail) {
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
            <button onClick={() => router.push("/admin/beranda/level")} className="mb-2 text-xs text-[#DE954F] hover:underline">
              ← Kembali
            </button>
            <h1 className="text-xl font-semibold text-[#4A2C19]">{levelDetail.fullName}</h1>
            <p className="mt-1 text-xs text-[#8A5B3D]">{levelDetail.stories.length} bacaan tersedia</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="rounded-xl bg-[#DE954F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#c57833]">
            + Tambah Bacaan
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {levelDetail.stories.map((story) => (
            <div key={story.id} className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] p-4 shadow-sm">
              <div className="relative h-32 w-full overflow-hidden rounded-md bg-[#FFF8EC]">
                <img src={story.imageUrl} alt={story.title} className="h-full w-full object-contain" />
              </div>
              <div className="mt-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#4A2C19]">{story.title}</h3>
                  <span
                    className={`rounded-xl px-2 py-0.5 text-[10px] font-medium ${story.status === "ACCEPTED" ? "bg-green-100 text-green-700" : story.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {story.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#8A5B3D] line-clamp-2">{story.description}</p>

                {story.approvalLogs.length > 0 && (
                  <div className="mt-3">
                    <button onClick={() => openLogsModal(story)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F4D4AC] bg-[#FFF8EC] px-3 py-2 text-xs font-medium text-[#4A2C19] hover:bg-[#FFF8EC]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Lihat Riwayat ({story.approvalLogs.length})</span>
                    </button>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEditModal(story)} className="flex-1 rounded-xl bg-[#DE954F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c57833]">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteStory(story.id)} className="flex-1 rounded-xl border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Approval Logs Modal */}
        {showLogsModal && selectedStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-[#DE954F] bg-[#FFF8EC] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#4A2C19]">Riwayat Perubahan</h2>
                  <p className="mt-1 text-xs text-[#8A5B3D]">{selectedStory.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowLogsModal(false);
                    setSelectedStory(null);
                  }}
                  className="rounded-xl p-1 hover:bg-[#F4D4AC]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4A2C19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-96 space-y-3 overflow-y-auto">
                {selectedStory.approvalLogs.length === 0 ? (
                  <div className="rounded-xl border border-[#F4D4AC] bg-[#FFF8EC] p-4 text-center text-xs text-[#8A5B3D]">Belum ada riwayat perubahan</div>
                ) : (
                  selectedStory.approvalLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <div key={log.id} className="rounded-xl border border-[#F4D4AC] bg-[#FFF8EC] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-xl px-2 py-1 text-xs font-medium ${
                                log.toStatus === "ACCEPTED" ? "bg-green-100 text-green-700" : log.toStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {log.fromStatus} → {log.toStatus}
                            </span>
                          </div>
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
                <button
                  onClick={() => {
                    setShowLogsModal(false);
                    setSelectedStory(null);
                  }}
                  className="w-full rounded-xl bg-[#DE954F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c57833]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-[#DE954F] bg-[#FFF8EC] p-6">
              <h2 className="text-lg font-semibold text-[#4A2C19]">Tambah Bacaan Baru</h2>
              <form onSubmit={handleCreateStory} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Judul</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-xs text-[#4A2C19]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-xs text-[#4A2C19]"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Passage</label>
                  <textarea
                    value={formData.passage}
                    onChange={(e) => setFormData({ ...formData, passage: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-xs text-[#4A2C19]"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Gambar Cover</label>
                  <div className="mt-1">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#DE954F] bg-[#FFF8EC] px-4 py-3 text-xs text-[#4A2C19] transition hover:bg-[#FFF8EC]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formData.imageCover ? formData.imageCover.name : "Pilih Gambar"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            imageCover: e.target.files?.[0] || null,
                          })
                        }
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        title: "",
                        description: "",
                        passage: "",
                        imageCover: null,
                      });
                    }}
                    className="flex-1 rounded-xl border border-[#DE954F] px-4 py-2 text-xs font-semibold text-[#DE954F] hover:bg-[#FFF8EC]"
                  >
                    Batal
                  </button>
                  <button type="submit" className="flex-1 rounded-xl bg-[#DE954F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c57833]">
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-[#DE954F] bg-[#FFF8EC] p-6">
              <h2 className="text-lg font-semibold text-[#4A2C19]">Edit Bacaan</h2>
              <form onSubmit={handleUpdateStory} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Judul</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1 w-full rounded-md border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-xs text-[#4A2C19]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-xs text-[#4A2C19]"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Passage</label>
                  <textarea
                    value={formData.passage}
                    onChange={(e) => setFormData({ ...formData, passage: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-xs text-[#4A2C19]"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A2C19]">Gambar Cover (opsional)</label>
                  <div className="mt-1">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#DE954F] bg-[#FFF8EC] px-4 py-3 text-xs text-[#4A2C19] transition hover:bg-[#FFF8EC]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formData.imageCover ? formData.imageCover.name : "Pilih Gambar Baru"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            imageCover: e.target.files?.[0] || null,
                          })
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedStory(null);
                      setFormData({
                        title: "",
                        description: "",
                        passage: "",
                        imageCover: null,
                      });
                    }}
                    className="flex-1 rounded-xl border border-[#DE954F] px-4 py-2 text-xs font-semibold text-[#DE954F] hover:bg-[#FFF8EC]"
                  >
                    Batal
                  </button>
                  <button type="submit" className="flex-1 rounded-xl bg-[#DE954F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c57833]">
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
