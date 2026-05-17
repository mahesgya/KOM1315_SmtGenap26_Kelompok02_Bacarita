"use client";

import StudentServices from "@/services/student.services";
import TestSessionServices from "@/services/test-session.services";
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Level, Story } from "@/types/story.types";
import { showToastError, showToastSuccess } from "@/components/utils/toast.utils";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setTestSession } from "@/redux/session.slice";
import { showSwalConfirm } from "@/components/utils/alert.utils";
import AuthServices from "@/services/auth.services";
import { BaseProfilePayload } from "@/types/auth.types";
import { ProfileCard } from "@/components/ui/profile.card";
import LogoutServices from "@/services/logout.services";
import { User2, X } from "lucide-react";

const SiswaBerandaPage = () => {
  const [levelsData, setLevelsData] = useState<Level[]>([]);
  const [profile, setProfile] = useState<BaseProfilePayload>();
  const dispatch = useDispatch();
  const router = useRouter();
  const showLockMessage: number | null = null;

  useEffect(() => {
    const fetchData = async () => {
      const responseLevels = await StudentServices.GetLevels(dispatch);
      const responseProfile = await AuthServices.GetProfileStudent(dispatch);

      if (responseProfile.success) {
        setProfile(responseProfile.data);
      } else {
        showToastError(responseProfile.error);
      }

      if (responseLevels.success) {
        setLevelsData(responseLevels.data);
      } else {
        showToastError(responseLevels.error);
      }
    };

    fetchData();
  }, []);

  const handleStoryClick = (story: Story, level: Level) => {
    const isFinishedPreTest = level.no === 0 && (level.bronzeCount != 0 || level.silverCount != 0 || level.goldCount != 0);

    if (isFinishedPreTest) {
      showToastError("Pre-test sudah pernah di selesaikan yaa");
      return;
    }

    if (!level.isUnlocked) {
      showToastError("Yuk coba level lain terlebih dahulu!");
    } else {
      showSwalConfirm({
        title: "Mulai Membaca?",
        message: `Mulai petualangan "${story.title}" sekarang?`,
        confirmText: "Mulai",
        cancelText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          TestSessionServices.StartTest(dispatch, story.id).then((response) => {
            if (response.success) {
              dispatch(setTestSession(response));
              router.push(`/siswa/test/${response.data.id}`);
            } else {
              showToastError(response.error);
            }
          });
        }
      });
    }
  };

  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

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

  const handleLogout = async () => {
    await LogoutServices.LogoutSiswa(dispatch);
    showToastSuccess("Logout Berhasil!");
    router.push("/");
  };

  return (
    <main className="verdana min-h-screen bg-[#EDD1B0]">
      <div className="relative w-full h-12 sm:h-18 md:h-24 overflow-hidden">
        <img src="/assets/ornamen/pattern.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
          <img src="/assets/logo/logo_coklat.webp" alt="Bacarita" className="h-10 sm:h-12 md:h-16 w-auto" />
        </div>
      </div>
      <div className="absolute right-4 top-6 z-20" ref={panelRef}>
        <div className="flex justify-end">
          <button aria-expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)} className="rounded-full bg-[#FFF8EC] text-[#513723] border border-[#DE954F] shadow-lg w-13 h-13 grid place-items-center active:scale-[0.98] transition">
            {panelOpen ? <X className="w-7 h-7" /> : <User2 className="w-7 h-7" />}
          </button>
        </div>
        <div className={`origin-top-right mt-3 transition-all duration-200 ${panelOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}`}>
          <ProfileCard role="student" profile={profile} handleLogout={handleLogout} />
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-10">
        <div className="relative w-full h-[300px] rounded-2xl overflow-hidden shadow-lg">
          <img src="/assets/beranda/background.webp" alt="Background" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between h-full p-6">
            <div className="flex items-end">
              <img src="/assets/maskot/maskotC.webp" alt="Maskot" className="w-40 sm:w-48 md:w-64 object-contain drop-shadow-lg" />
              <div className="bg-[#FFF8EC] p-6 rounded-xl shadow-md max-w-md -ml-8 mb-32">
                <h1 className="text-xl sm:text-2xl font-bold text-[#513723]">Halo, {profile?.username} Petualang Cilik!</h1>
                <p className="text-sm sm:text-base text-[#6C5644] mt-1">Mari berpetualang dan belajar sambil bermain.</p>
              </div>
            </div>

            <div className="absolute bottom-0 right-5 hidden md:block">
              <img src="/assets/beranda/wood.webp" alt="Papan Kayu" className="w-64 object-contain drop-shadow-md" />
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-12">
          {levelsData.map((level) => (
            <div key={level.id} className="transition duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  {!level.isUnlocked && <span className="text-2xl">🔒</span>}
                  {level.no === 0 || level.no === 9999 ? <h2 className="text-2xl font-bold text-[#513723]">{level.name}</h2> : <h2 className="text-2xl font-bold text-[#513723]">{level.fullName}</h2>}
                </div>
                {level.isUnlocked && (
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <div className="flex items-center gap-1.5">
                      <img src="/assets/medals/gold_medal.svg" alt="Gold" className="w-8 h-8" />
                      <span className="font-bold text-lg text-amber-600">{level.goldCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <img src="/assets/medals/silver_medal.svg" alt="Silver" className="w-8 h-8" />
                      <span className="font-bold text-lg text-slate-500">{level.silverCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <img src="/assets/medals/bronze_medal.svg" alt="Bronze" className="w-8 h-8" />
                      <span className="font-bold text-lg text-orange-700">{level.bronzeCount}</span>
                    </div>
                  </div>
                )}
              </div>

              {level.isUnlocked && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1 text-sm text-[#6C5644]">
                    <span>Progress Level</span>
                    <span className="font-semibold">{level.progress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${level.progress}%` }}></div>
                  </div>
                </div>
              )}
              <div className="bg-[url('/assets/beranda/forest_bg.webp')] p-6 rounded-2xl bg-cover bg-center flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                {level.stories.map((story) => (
                  <div key={story.id} className="flex-shrink-0">
                    <div
                      className={`w-72 h-96 bg-[#FFF8E7] border-2 border-[#E9E2CF] shadow-md rounded-2xl p-3 transition-all duration-300 relative group ${
                        level.isUnlocked ? "cursor-pointer hover:shadow-xl hover:-translate-y-1" : "cursor-not-allowed"
                      }`}
                      onClick={() => handleStoryClick(story, level)}
                    >
                      {!level.isUnlocked && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center z-10">
                          <div className="text-center text-white">
                            <div className="text-4xl mb-2">🔒</div>
                            <div className="font-bold tracking-wider">TERKUNCI</div>
                          </div>
                        </div>
                      )}

                      <img src={story.imageUrl || "/assets/placeholder.webp"} alt={story.title} className="w-full h-40 object-cover rounded-xl mb-3" />

                      <div className="flex flex-col h-44 justify-between">
                        <div>
                          <h3 className="font-bold text-md text-[#513723]">{story.title}</h3>
                          <p className="text-sm text-[#6C5644] mt-1 line-clamp-3">{story.description}</p>
                        </div>
                        <div className="flex items-center justify-end gap-2 h-10">
                          {level.isUnlocked && (
                            <>
                              {story.isGoldMedal && <img src="/assets/medals/gold_medal.svg" alt="Gold" className="w-10 h-10" />}
                              {story.isSilverMedal && <img src="/assets/medals/silver_medal.svg" alt="Silver" className="w-10 h-10" />}
                              {story.isBronzeMedal && <img src="/assets/medals/bronze_medal.svg" alt="Bronze" className="w-10 h-10" />}
                              {!story.isGoldMedal && !story.isSilverMedal && !story.isBronzeMedal && !level.isSkipped && <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Belum Dibaca</span>}
                            </>
                          )}
                          {level.isSkipped && (
                            <>
                              <img src="/assets/medals/checkbox.webp" className="w-10 h-10"></img>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showLockMessage === level.id && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 rounded-r-lg" role="alert">
                  <p className="font-bold">Terkunci!</p>
                  <p>Kamu harus mendapatkan {level.requiredPoints} poin untuk membuka level ini.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <img src="/assets/ornamen/gabung1.webp" alt="" className="object-cover w-[100dvw]" />
      </div>
    </main>
  );
};

export default SiswaBerandaPage;
