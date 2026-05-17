"use client";

import { useEffect, useState } from "react";
import TeacherServices from "@/services/teacher.services";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { BookOpen, Users, CheckCircle, TrendingUp, X, ChevronLeft, Award } from "lucide-react";
import type { StudentData, TestSessionResult } from "@/types/teacher.types";
import { useDispatch, useSelector } from "react-redux";
import { StatCard, MedalBadge } from "@/components/guru/beranda";
import { showToastError } from "@/components/utils/toast.utils";
import { RootState } from "@/redux/store";
import SessionDetailModal from "@/components/guru/detail.modal";

type ViewMode = "list" | "detail-student" | "detail-test";

const PerformaMurid = () => {
  const dispatch = useDispatch();

  const [students, setStudents] = useState<StudentData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [studentTests, setStudentTests] = useState<TestSessionResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestSessionResult | null>(null);
  const [searchStudent, setSearchStudent] = useState<string>("");

  const isLoading = useSelector((state: RootState) => state.general.isLoading);

  useEffect(() => {
    const fetchStudents = async () => {
      const response = await TeacherServices.GetAllStudent(dispatch);
      if (response.success) {
        setStudents(response.data);
      } else {
        showToastError(response.error);
      }
    };

    fetchStudents();
  }, []);

  const handleSelectStudent = async (student: StudentData) => {
    setSelectedStudent(student);
    setViewMode("detail-student");
    const response = await TeacherServices.GetAllTestOfStudent(dispatch, student.id);
    if (response.success) {
      setStudentTests(response.data);
    } else {
      showToastError(response.error);
    }
  };

  const handleSelectTest = async (test: TestSessionResult) => {
    if (!selectedStudent) return;
    const response = await TeacherServices.GetSingleTestOfStudent(dispatch, selectedStudent.id, test.id);
    if (response.success) {
      setSelectedTest(response.data);
      setViewMode("detail-test");
    } else {
      showToastError(response.error);
    }
  };

  const handleBack = () => {
    if (viewMode === "detail-test") {
      setViewMode("detail-student");
      setSelectedTest(null);
    } else if (viewMode === "detail-student") {
      setViewMode("list");
      setSelectedStudent(null);
      setStudentTests([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredStudents = students.filter((s) => s.fullName.toLowerCase().includes(searchStudent.toLowerCase()));

  if (viewMode === "list") {
    return (
      <div className="min-h-screen ">
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-[#5a4631] mb-2">Performa Murid</h1>
          <p className="text-[#5a4631] opacity-75">Pantau progres dan performa setiap murid Anda</p>
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE954F] mx-auto mb-4" />
            <p className="text-[#5a4631] font-medium">Memuat data siswa...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl px-4 py-3 text-[#5a4631] placeholder-[#5a4631] placeholder-opacity-50 focus:outline-none focus:border-[#DE954F]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStudents.map((student) => (
                <div key={student.id} onClick={() => handleSelectStudent(student)} className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#5a4631]">{student.fullName}</h3>
                      <p className="text-sm text-[#5a4631] opacity-75">@{student.username}</p>
                    </div>
                    <div className="bg-[#DE954F] text-white rounded-full p-2">
                      <Users size={20} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#5a4631] opacity-75">Total Tes</span>
                      <span className="font-bold text-[#5a4631]">{student.totalTestSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#5a4631] opacity-75">Tes Selesai</span>
                      <span className="font-bold text-[#5a4631]">{student.completedTestSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#5a4631] opacity-75">Rata-rata Skor</span>
                      <span className="font-bold text-lg text-[#DE954F]">{student.averageScore}</span>
                    </div>
                  </div>

                  {student.parent && (
                    <div className="mt-4 pt-4 border-t border-[#DE954F] opacity-75">
                      <p className="text-xs text-[#5a4631]">
                        Parent: <span className="font-medium">{student.parent.fullName}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && <div className="text-center py-12 text-[#5a4631] opacity-75">Tidak ada data siswa</div>}
          </>
        )}
      </div>
    );
  }

  if (viewMode === "detail-student" && selectedStudent) {
   const completedTests = studentTests.filter((t) => t.isCompleted);
    const sortedTests = [...completedTests].sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
    const totalTests = sortedTests.length;
    const chartData = sortedTests.map((test, idx) => ({
      name: `Tes ${totalTests - idx}`,
      score: test.score,
    }));

    return (
      <div className="min-h-screen">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={handleBack} className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-3 hover:bg-[#Fff8ec] transition-colors">
            <ChevronLeft size={24} className="text-[#5a4631]" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-[#5a4631]">{selectedStudent.fullName}</h1>
            <p className="text-[#5a4631] opacity-75">Detail performa dan tes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<BookOpen size={32} />} title="Total Tes" value={selectedStudent.totalTestSessions} />
          <StatCard icon={<CheckCircle size={32} />} title="Tes Selesai" value={selectedStudent.completedTestSessions} />
          <StatCard icon={<TrendingUp size={32} />} title="Rata-rata Skor" value={selectedStudent.averageScore} />
          <StatCard icon={<Award size={32} />} title="Status" value={selectedStudent.inProgressTestSessions > 0 ? "Sedang Belajar" : "Siap"} />
        </div>

        {chartData.length > 0 && (
          <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-8 shadow-sm mb-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#5a4631] mb-2">Progres Skor Tes</h2>
              <p className="text-sm text-[#5a4631] opacity-75">Tren peningkatan skor siswa dari waktu ke waktu</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DE954F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DE954F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DE954F" opacity={0.2} />
                <XAxis dataKey="name" stroke="#5a4631" style={{ fontSize: "12px" }} />
                <YAxis stroke="#5a4631" style={{ fontSize: "12px" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#Fff8ec",
                    border: "2px solid #DE954F",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{ color: "#5a4631", fontWeight: "bold" }}
                  formatter={(value) => [value, "Skor"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#DE954F"
                  strokeWidth={3}
                  dot={{ fill: "#DE954F", r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: "#DE954F" }}
                  isAnimationActive={true}
                  animationDuration={800}
                  fill="url(#colorScore)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-[#5a4631] mb-4">Progres Level</h2>
          <div className="space-y-3">
            {selectedStudent.levelProgresses.map((level) => (
              <div key={level.levelId} className="bg-[#Fff8ec] border border-[#DE954F] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[#5a4631]">{level.levelFullName}</h3>
                  <div className="flex gap-1">
                    {Array(level.goldCount)
                      .fill(0)
                      .map((_, i) => (
                        <img key={`gold-${i}`} src="/assets/medals/gold_medal.svg" alt="gold" className="w-5 h-5" />
                      ))}
                    {Array(level.silverCount)
                      .fill(0)
                      .map((_, i) => (
                        <img key={`silver-${i}`} src="/assets/medals/silver_medal.svg" alt="silver" className="w-5 h-5" />
                      ))}
                    {Array(level.bronzeCount)
                      .fill(0)
                      .map((_, i) => (
                        <img key={`bronze-${i}`} src="/assets/medals/bronze_medal.svg" alt="bronze" className="w-5 h-5" />
                      ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5a4631]">
                  <div className="flex-1 h-2 bg-[#Fff8ec] rounded-full overflow-hidden border border-[#DE954F]">
                    <div className="h-full bg-[#DE954F]" style={{ width: `${level.progress ? level.progress : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium">{level.isCompleted ? "✓ Selesai" : level.isUnlocked ? "Terbuka" : "Terkunci"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#5a4631] mb-4">Riwayat Tes</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DE954F] mx-auto mb-2" />
              <p className="text-[#5a4631]">Memuat data tes...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTests.length === 0 ? (
                <p className="text-center text-[#5a4631] opacity-75 py-8">Belum ada data tes</p>
              ) : (
                completedTests.map((test) => (
                  <div key={test.id} onClick={() => handleSelectTest(test)} className="bg-[#Fff8ec] border border-[#DE954F] rounded-lg p-4 cursor-pointer hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-[#5a4631]">{test.titleAtTaken}</p>
                        <p className="text-sm text-[#5a4631] opacity-75">{test.levelFullName}</p>
                        <p className="text-xs text-[#5a4631] opacity-60 mt-1">{formatDate(test.startedAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex text-right">
                          <p className="font-bold text-lg text-[#DE954F]">{test.score}</p>
                          <MedalBadge medal={test.medal} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "detail-test" && selectedTest && selectedStudent) {
    return (
      <div>
        <SessionDetailModal session={selectedTest} onClose={handleBack} />
      </div>
    );
  }

  return null;
};

export default PerformaMurid;
