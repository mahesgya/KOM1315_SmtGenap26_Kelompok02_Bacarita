"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { ParentsEmailandFullName, RegisterStudentPayload } from "@/types/teacher.types";
import { useSelector } from "react-redux";
import TeacherServices from "@/services/teacher.services";
import { showToastError, showToastSuccess } from "@/components/utils/toast.utils";
import { User, AtSign, Users, Mail, Check, LoaderCircle } from "lucide-react";

const TambahMurid = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.general.isLoading);

  const [form, setForm] = useState<RegisterStudentPayload>({
    studentUsername: "",
    studentFullName: "",
    parentEmail: "",
    parentFullName: "",
    jumpLevelTo: 2,
  });

  const [existingParents, setExistingParents] = useState<ParentsEmailandFullName[]>([]);
  const [isNewParent, setIsNewParent] = useState(true);
  const [isJumpLevel, setIsJumpLevel] = useState(false);

  useEffect(() => {
    const fetchParents = async () => {
      const response = await TeacherServices.GetParentsEmail(dispatch);
      if (response.success) {
        setExistingParents(response.data);
      }
    };

    fetchParents();
  }, []);

  const handleParentSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmail = e.target.value;

    if (selectedEmail === "new") {
      setIsNewParent(true);
      setForm({ ...form, parentEmail: "", parentFullName: "" });
    } else {
      setIsNewParent(false);
      setForm({ ...form, parentEmail: selectedEmail, parentFullName: "" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<RegisterStudentPayload> = { ...form };

    if (!isNewParent) {
      delete payload.parentFullName;
    }

    if (!isJumpLevel) {
      delete payload.jumpLevelTo;
    }

    const response = await TeacherServices.RegisterStudent(payload as RegisterStudentPayload, dispatch);

    if (response.success) {
      showToastSuccess("Siswa berhasil ditambahkan!");
    } else {
      showToastError(response.error || "Gagal menambahkan siswa.");
    }

    setForm({ studentUsername: "", studentFullName: "", parentEmail: "", parentFullName: "" });
    setIsNewParent(true);
  };

  return (
    <div className="p-4 sm:p-2">
      <div className="max-w-4xl mx-auto p-6 sm:p-8 md:p-10 space-y-4 bg-[#Fff8ec] border-2 border-[#DE954F] rounded-2xl shadow-sm">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="verdana text-center text-2xl md:text-3xl font-bold text-[#5A3E2B]">Formulir Murid Baru</h2>
          <p className="text-[#8D6E52] verdana text-sm">Lengkapi detail di bawah ini untuk menambahkan murid ke dalam kelas Anda.</p>
        </div>

        <hr className="border-[#DE954F]" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block">
              <span className="verdana text-sm font-medium text-[#5A3E2B]">Nama Lengkap Siswa</span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-[#B8A191]" />
                </div>
                <input
                  autoComplete="off"
                  name="studentFullName"
                  value={form.studentFullName}
                  onChange={handleInputChange}
                  placeholder="Contoh: Budi Sanjaya"
                  className="pl-10 w-full rounded-[12px] border border-[#DE954F] bg-[#Fff8ec] shadow-sm px-4 py-3 text-[#5A3E2B] placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition"
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="verdana text-sm font-medium text-[#5A3E2B]">Username Siswa</span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <AtSign className="h-5 w-5 text-[#B8A191]" />
                </div>
                <input
                  autoComplete="off"
                  name="studentUsername"
                  value={form.studentUsername}
                  onChange={handleInputChange}
                  placeholder="Contoh: budisanjaya21"
                  className="pl-10 w-full rounded-[12px] border border-[#DE954F] bg-[#Fff8ec] shadow-sm px-4 py-3 text-[#5A3E2B] placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition"
                  required
                />
              </div>
            </label>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#DE954F]">
            <div>
              <h3 className="text-lg font-semibold text-[#5A3E2B] verdana">Informasi Orang Tua</h3>
              <p className="text-sm text-[#8D6E52] verdana mt-1">Pilih orang tua yang sudah ada atau tambahkan yang baru.</p>
            </div>
            <label className="block">
              <span className="verdana text-sm font-medium text-[#5A3E2B]">Pilih Orang Tua</span>
              <select
                onChange={handleParentSelectionChange}
                value={isNewParent ? "new" : form.parentEmail}
                className="w-full rounded-[12px] border border-[#DE954F] bg-[#Fff8ec] shadow-sm px-4 py-3 text-[#5A3E2B] placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition"
              >
                <option value="new">Tambah Orang Tua Baru</option>
                {existingParents.map((parent) => (
                  <option key={parent.email} value={parent.email}>
                    {parent.fullName} - {parent.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="verdana text-sm font-medium text-[#5A3E2B]">Email Orang Tua</span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-[#B8A191]" />
                </div>
                <input
                  autoComplete="off"
                  name="parentEmail"
                  type="email"
                  value={form.parentEmail}
                  onChange={handleInputChange}
                  placeholder={isNewParent ? "email@contoh.com" : "Email dipilih dari daftar"}
                  className="pl-10 w-full rounded-[12px] border border-[#DE954F] bg-[#Fff8ec] shadow-sm px-4 py-3 text-[#5A3E2B] placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition"
                  disabled={!isNewParent}
                />
              </div>
            </label>

            {isNewParent && (
              <label className="block">
                <span className="verdana text-sm font-medium text-[#5A3E2B]">Nama Lengkap Orang Tua</span>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Users className="h-5 w-5 text-[#B8A191]" />
                  </div>
                  <input
                    autoComplete="off"
                    name="parentFullName"
                    value={form.parentFullName}
                    onChange={handleInputChange}
                    placeholder="Contoh: Ayah Budi"
                    className="pl-10 w-full rounded-[12px] border border-[#DE954F] bg-[#Fff8ec] shadow-sm px-4 py-3 text-[#5A3E2B] placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition"
                    required={isNewParent}
                  />
                </div>
              </label>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-[#DE954F]">
            <div>
              <h3 className="text-lg font-semibold text-[#5A3E2B] verdana">Skip level Siswa</h3>
              <p className="text-sm text-[#8D6E52] verdana mt-1">Jika ingin skip level, aktifkan opsi lalu pilih level tujuan.</p>
            </div>

            <div className="flex items-center gap-3">
              <input id="jump-toggle" type="checkbox" className="h-4 w-4 text-white accent-[#DE954F] cursor-pointer" checked={isJumpLevel} onChange={(e) => setIsJumpLevel(e.target.checked)} />
              <label htmlFor="jump-toggle" className="text-[#5A3E2B] verdana">
                Aktifkan skip level
              </label>
            </div>

            <div className="max-w-xs">
              <label className="block text-sm text-[#5A3E2B] verdana mb-1">Pilih level tujuan</label>
              <select
                className="w-full verdana text-[#5A3E2B] bg-[#FFF8EC] shadow-sm border border-[#DE954F] rounded-lg px-3 py-2 disabled:opacity-50"
                disabled={!isJumpLevel}
                value={form.jumpLevelTo}
                onChange={(e) => setForm((prev) => ({ ...prev, jumpLevelTo: Number(e.target.value) }))}
              >
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
                <option value={4}>Level 4</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="verdana inline-flex items-center gap-2 rounded-xl bg-[#DE954F] px-5 py-2.5 font-semibold text-white shadow-md transition-all duration-300 ease-in-out hover:bg-[#B67432] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              <span>{isLoading ? "Menyimpan..." : "Simpan Murid"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahMurid;
