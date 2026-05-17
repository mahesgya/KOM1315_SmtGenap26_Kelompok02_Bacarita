"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BookOpen, Users, CheckCircle, Clock, Trophy, X, Filter } from "lucide-react";
import type { OverviewData, TestSessionResult } from "@/types/teacher.types";
import { useDispatch, useSelector } from "react-redux";
import { StatCard, MedalBadge } from "@/components/guru/beranda";
import { RootState } from "@/redux/store";
import ParentServices from "@/services/parent.services";
import SessionDetailModal from "@/components/guru/detail.modal";

const BerandaOrangTua = () => {
  const dispatch = useDispatch();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const isLoading = useSelector((state: RootState) => state.general.isLoading);
  const [activeSession, setActiveSession] = useState<TestSessionResult | null>(null);
  const [filterMedal, setFilterMedal] = useState<string>("ALL");
  const [searchStudent, setSearchStudent] = useState<string>("");

  useEffect(() => {
    const fetchOverview = async () => {
      const response = await ParentServices.GetOverview(dispatch);

      if (response.success) {
        setOverview(response.data);
      }
    };

    fetchOverview();
  }, []);

  if (isLoading || !overview) {
    return (
      <div className="min-h-screen bg-[#Fff8ec] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE954F] mx-auto mb-4" />
          <p className="text-[#5a4631] font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  const completedSessions = overview.testSessions.filter((s) => s.isCompleted);

  const studentAverages = completedSessions
    .reduce((acc, session) => {
      const existing = acc.find((s) => s.studentId === session.student.id);
      if (existing) {
        existing.scores.push(session.score);
      } else {
        acc.push({
          studentId: session.student.id,
          studentName: session.student.fullName,
          scores: [session.score],
        });
      }
      return acc;
    }, [] as Array<{ studentId: string; studentName: string; scores: number[] }>)
    .map((item) => ({
      name: item.studentName.substring(0, 12),
      average: Math.round(item.scores.reduce((a, b) => a + b, 0) / item.scores.length),
    }));

  const medalDistribution = completedSessions.reduce((acc, session) => {
    const medal = session.medal;
    const existing = acc.find((m) => m.name === medal);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: medal, value: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const medalColors: Record<string, string> = {
    GOLD: "#FCD34D",
    SILVER: "#D1D5DB",
    BRONZE: "#FB923C",
  };

  let filteredSessions = completedSessions;
  if (filterMedal !== "ALL") {
    filteredSessions = filteredSessions.filter((s) => s.medal === filterMedal);
  }
  if (searchStudent) {
    filteredSessions = filteredSessions.filter((s) => s.student.fullName.toLowerCase().includes(searchStudent.toLowerCase()));
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const uniqueMedals = [...new Set(completedSessions.map((s) => s.medal))];

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#5a4631] mb-2">Dashboard Orang Tua</h1>
        <p className="text-[#5a4631] opacity-75">Pantau progres dan performa anak Anda secara real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <StatCard icon={<Users size={24} />} title="Jumlah Anak" value={overview.totalStudents} />
        <StatCard icon={<BookOpen size={24} />} title="Total Tes" value={overview.totalTestSessions} />
        <StatCard icon={<CheckCircle size={24} />} title="Tes Selesai" value={overview.completedTestSessions} />
        <StatCard icon={<Clock size={24} />} title="Tes Berlangsung" value={overview.inProgressTestSessions} />
        <StatCard icon={<Trophy size={24} />} title="Rata-rata Skor" value={overview.averageScore} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-[#5a4631] mb-4">Rata-rata Skor Anak</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={studentAverages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DE954F" opacity={0.3} />
              <XAxis dataKey="name" stroke="#5a4631" tickFormatter={(v) => String(v).split(" ")[0]} />
              <YAxis stroke="#5a4631" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#Fff8ec",
                  border: "2px solid #DE954F",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#5a4631" }}
              />
              <Bar dataKey="average" fill="#DE954F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-[#5a4631] mb-4">Distribusi Medali</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={medalDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                {medalDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={medalColors[entry.name] || "#DE954F"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#Fff8ec",
                  border: "2px solid #DE954F",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#5a4631" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-[#5a4631]">Riwayat Tes Anak (Selesai)</h2>
          <Filter size={20} className="text-[#DE954F]" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Cari nama anak..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="flex-1 bg-[#Fff8ec] border-2 border-[#DE954F] rounded-lg px-4 py-2 text-[#5a4631] placeholder-[#5a4631] placeholder-opacity-50 focus:outline-none focus:border-[#DE954F]"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFilterMedal("ALL")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterMedal === "ALL" ? "bg-[#DE954F] text-white border-2 border-[#DE954F]" : "bg-[#Fff8ec] border-2 border-[#DE954F] text-[#5a4631] hover:bg-[#DE954F] hover:text-white"
              }`}
            >
              Semua
            </button>
            {uniqueMedals.map((medal) => (
              <button
                key={medal}
                onClick={() => setFilterMedal(medal)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterMedal === medal ? "bg-[#DE954F] text-white border-2 border-[#DE954F]" : "bg-[#Fff8ec] border-2 border-[#DE954F] text-[#5a4631] hover:bg-[#DE954F] hover:text-white"
                }`}
              >
                {medal}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#DE954F]">
                <th className="text-left py-3 px-4 text-[#5a4631] font-semibold">Anak</th>
                <th className="text-left py-3 px-4 text-[#5a4631] font-semibold">Level</th>
                <th className="text-left py-3 px-4 text-[#5a4631] font-semibold">Skor</th>
                <th className="text-left py-3 px-4 text-[#5a4631] font-semibold">Medali</th>
                <th className="text-left py-3 px-4 text-[#5a4631] font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="border-b border-[#DE954F] hover:bg-[#Fff8ec] transition-colors duration-200">
                  <td className="py-3 px-4 text-[#5a4631] font-medium">{session.student.fullName}</td>
                  <td className="py-3 px-4 text-[#5a4631] text-sm">{session.levelFullName}</td>
                  <td className="py-3 px-4 text-[#5a4631] font-bold text-lg">{session.score}</td>
                  <td className="py-3 px-4">
                    <MedalBadge medal={session.medal} />
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => setActiveSession(session)} className="bg-[#DE954F] text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity text-sm font-medium">
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSessions.length === 0 && <div className="text-center py-8 text-[#5a4631] opacity-75">Tidak ada data yang sesuai filter</div>}
        </div>
      </div>

      {activeSession && <SessionDetailModal session={activeSession} onClose={() => setActiveSession(null)} />}
    </div>
  );
};

export default BerandaOrangTua;
