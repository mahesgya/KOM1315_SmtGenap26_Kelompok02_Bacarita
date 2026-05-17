"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { X } from "lucide-react";
import type { TestSessionResult } from "@/types/teacher.types";
import { MedalBadge } from "@/components/guru/beranda";

const SessionDetailModal = ({ session, onClose }: { session: TestSessionResult; onClose: () => void }) => {
  const summary = session.distractedEyeEventsSummary;

  const timeBreakdownData = [
    { name: "Fokus", value: summary?.timeBreakdownFocus || 0, color: "#22c55e" },
    { name: "Menoleh", value: summary?.timeBreakdownTurning || 0, color: "#f59e0b" },
    { name: "Melirik", value: summary?.timeBreakdownGlance || 0, color: "#3b82f6" },
    { name: "Tidak Terdeteksi", value: summary?.timeBreakdownNotDetected || 0, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  const totalDuration = summary?.timeBreakdownFocus + summary?.timeBreakdownGlance + summary?.timeBreakdownNotDetected + summary?.timeBreakdownTurning;
  const focusPercentage = (((summary?.timeBreakdownFocus || 0) / totalDuration) * 100).toFixed(1);
  const distractionPercentage = ((((summary?.timeBreakdownTurning || 0) + (summary?.timeBreakdownGlance || 0)) / totalDuration) * 100).toFixed(1);

  const distractionTypeCounts = [
    { name: "Menoleh", count: summary?.turningTriggersCount, color: "#f59e0b" },
    { name: "Melirik", count: summary?.glanceTriggersCount, color: "#3b82f6" },
  ];

  const distractionConfig: Record<string, { color: string; label: string; emoji: string; bgColor: string; borderColor: string }> = {
    FOCUS: {
      color: "#22c55e",
      label: "Fokus",
      emoji: "✓",
      bgColor: "bg-[#f0fdf4]",
      borderColor: "border-green-200",
    },
    TURNING: {
      color: "#f59e0b",
      label: "Menoleh",
      emoji: "↻",
      bgColor: "bg-[#fffbeb]",
      borderColor: "border-amber-200",
    },
    GLANCE: {
      color: "#3b82f6",
      label: "Melirik",
      emoji: "👁",
      bgColor: "bg-[#eff6ff]",
      borderColor: "border-blue-200",
    },
    NOT_DETECTED: {
      color: "#ef4444",
      label: "Tidak Terdeteksi",
      emoji: "?",
      bgColor: "bg-[#fef2f2]",
      borderColor: "border-red-200",
    },
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="verdana fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl max-w-[85vw] w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky z-40 top-0 bg-[#Fff8ec] border-b-2 border-[#DE954F] p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#5a4631]">Detail Hasil Tes</h3>
            <p className="text-sm text-[#5a4631] opacity-75 mt-1">
              {session.student.fullName} - <span className="text-[10px] font-normal">{session.id}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-[#5a4631] hover:text-[#DE954F] transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-lg p-4">
              <p className="text-xs text-[#5a4631] opacity-75 font-medium">Skor Akhir</p>
              <p className="text-2xl font-bold text-[#5a4631] mt-1">{session.score}</p>
            </div>
            <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-lg p-4">
              <p className="text-xs text-[#5a4631] opacity-75 font-medium">Medali</p>
              <div className="mt-2">
                <MedalBadge medal={session.medal} />
              </div>
            </div>
            <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-lg p-4">
              <p className="text-xs text-[#5a4631] opacity-75 font-medium">Level</p>
              <p className="text-md font-bold text-[#5a4631] mt-1">{session.levelFullName}</p>
            </div>
          </div>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-lg p-4">
                <p className="text-xs text-[#5a4631] opacity-75 font-medium">Fokus</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{focusPercentage}%</p>
                <p className="text-xs opacity-80">
                  {formatDuration(summary.timeBreakdownFocus)} dari {formatDuration(totalDuration)}
                </p>
              </div>
              <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-lg p-4">
                <p className="text-xs text-[#5a4631] opacity-75 font-medium">Distraksi</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{distractionPercentage}%</p>
                <p className="text-xs opacity-80">{summary.turningTriggersCount + summary.glanceTriggersCount} kejadian</p>
              </div>
              <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-lg p-4">
                <p className="text-xs text-[#5a4631] opacity-75 font-medium">Total Waktu</p>
                <p className="text-2xl text-[#5a4631] font-bold  mt-1">{Math.floor(totalDuration)}s</p>
              </div>
            </div>
          )}

          {summary && (
            <div className="bg-[#Fff8ec] rounded-xl border-2 border-[#DE954F] p-6">
              <h4 className="font-bold text-[#5a4631] mb-6 text-lg border-b border-[#DE954F]/50 pb-2">Analisa Fokus & Pergerakan Mata</h4>

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div className="h-[250px] w-full">
                  <h4 className="text-center text-sm font-semibold text-[#5a4631] mb-2">Distribusi Waktu Total</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={timeBreakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {timeBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} detik`, "Durasi"]} contentStyle={{ backgroundColor: "#Fff8ec", borderColor: "#DE954F", borderRadius: "8px", color: "#5a4631" }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl h-[250px] w-full">
                  <h4 className="text-center text-sm font-semibold text-[#5a4631] mb-4">Frekuensi Distraksi</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distractionTypeCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: "#Fff8ec", borderColor: "#DE954F", borderRadius: "8px", color: "#5a4631" }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {distractionTypeCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#fff8ec] border-2 border-[#DE954F] rounded-xl p-6 shadow-sm">
            <h4 className="font-bold text-[#5a4631] mb-4 text-lg flex items-center gap-2">Riwayat Event Distraksi ({session.distractedEyeEvents.length} event)</h4>
            <div className="space-y-2 grid md:grid-cols-2 space-x-2 max-h-60 overflow-y-auto">
              {session.distractedEyeEvents.map((event, index) => {
                const config = distractionConfig[event.distractionType];
                return (
                  <div key={event.id} className={`flex items-center justify-between p-3 shadow-sm rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: config.color }}>
                          {config.label}
                        </p>
                        <p className="text-xs text-[#5a4631]/90">Kata: {event.occurredAtWord}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#5a4631]/80">{event.triggerDurationMs / 1000}s</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#5a4631] mb-4 text-lg border-b border-[#DE954F]/30 pb-2">Hasil Evaluasi Bacaan ({session.sttWordResults.length} kata)</h4>
            <div className="space-y-3">
              {session.sttWordResults.map((result, index) => {
                const accuracyColor = result.accuracy >= 70 ? "from-green-400 to-green-600" : result.accuracy >= 50 ? "from-yellow-400 to-yellow-600" : "from-red-400 to-red-600";

                return (
                  <div key={result.id} className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${accuracyColor} text-white text-xs font-bold`}>{index + 1}</span>
                        <div>
                          <p className="font-semibold text-[#5a4631]">Kata {index + 1}</p>
                          <p className="text-xs text-[#5a4631] opacity-60">Akurasi: {result.accuracy}%</p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-white font-bold text-sm bg-gradient-to-r ${accuracyColor}`}>{result.accuracy}%</div>
                    </div>

                    <div className="mb-4">
                      <div className="h-3 bg-white border-2 border-[#DE954F] rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${accuracyColor}`} style={{ width: `${result.accuracy}%` }} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-[#Fff8ec] border-2 border-green-200 rounded-lg p-4">
                        <p className="text-xs font-bold text-green-700 mb-2">✓ KATA YANG DIHARAPKAN</p>
                        <p className="text-[#5a4631] font-semibold text-base leading-relaxed">{result.expectedWord}</p>
                      </div>
                      <div className="bg-[#Fff8ec] border-2 border-orange-200 rounded-lg p-4">
                        <p className="text-xs font-bold text-orange-700 mb-2">🎤 KATA YANG DIUCAPKAN</p>
                        <p className="text-[#5a4631] text-base leading-relaxed">{result.spokenWord}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
