"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthServices from "@/services/auth.services";
import { showToastError, showToastSuccess } from "@/components/utils/toast.utils";
import { RegisterGuruPayload } from "@/types/auth.types";
import { useDispatch } from "react-redux";

const RegisterGuruPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [form, setForm] = useState<RegisterGuruPayload>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    schoolName: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const onChange = (key: keyof RegisterGuruPayload) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToastError("Konfirmasi password tidak sama.");
      return;
    }

    const response = await AuthServices.RegisterGuru(form, dispatch);
    if (response.success) {
      showToastSuccess("Pendaftaran berhasil! Silakan login.");
      router.push("/guru/login");
    } else if (response.success === false) {
      showToastError(response.error);
    }
  };

  const baseInput = "w-full rounded-[12px] border border-[#DE954F] bg-white px-4 py-3 text-[#5A3E2B] " + "placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition";

  return (
    <main className="min-h-screen flex items-center justify-center bg-cover bg-center p-6" style={{ backgroundImage: "url('/assets/peran/bg-pilihperan.webp')" }}>
      <div className="w-full max-w-md bg-[#FBF8F2]/95 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-[30px] px-8 py-10 text-center">
        <h1 className="text-3xl font-extrabold text-[#5A3E2B] mb-2">Daftar Akun Guru</h1>
        <p className="text-[#5A3E2B]/80 mb-6">Yuk bergabung dan kelola progres murid!</p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <input type="text" placeholder="Nama Lengkap" value={form.fullName} onChange={onChange("fullName")} className={baseInput} autoComplete="name" required />
          </div>

          <div>
            <input type="text" placeholder="Nama Sekolah" value={form.schoolName} onChange={onChange("schoolName")} className={baseInput} required />
          </div>

          <div>
            <input type="email" placeholder="Alamat Email" value={form.email} onChange={onChange("email")} className={baseInput} autoComplete="email" required />
          </div>

          <div>
            <input type="text" placeholder="Nama Akun (username)" value={form.username} onChange={onChange("username")} className={baseInput} autoComplete="username" required />
          </div>

          <div className="relative">
            <input type={showPw ? "text" : "password"} placeholder="Password" value={form.password} onChange={onChange("password")} className={baseInput} autoComplete="new-password" required />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-3 text-[#B8A191] hover:text-[#8D6E52] transition" aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}>
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPw2 ? "text" : "password"}
              placeholder="Konfirmasi Password"
              value={form.confirmPassword}
              onChange={onChange("confirmPassword")}
              className={baseInput + (form.confirmPassword && form.confirmPassword !== form.password ? " ring-2 ring-red-400" : "")}
              autoComplete="new-password"
              required
            />
            <button type="button" onClick={() => setShowPw2((v) => !v)} className="absolute right-3 top-3 text-[#B8A191] hover:text-[#8D6E52] transition" aria-label={showPw2 ? "Sembunyikan password" : "Tampilkan password"}>
              {showPw2 ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="w-full bg-[#DE954F] hover:bg-[#B67432] disabled:opacity-60 disabled:cursor-not-allowed text-white text-lg font-semibold py-3 rounded-[12px] shadow-md transition">
            Daftar
          </button>
        </form>

        <p className="mt-6 text-[#5A3E2B] text-sm font-semibold">
          Sudah punya akun?{" "}
          <span onClick={() => router.push("/guru/login")} className="text-[#DE954F] hover:underline cursor-pointer">
            Masuk disini
          </span>
        </p>
      </div>
    </main>
  );
};

export default RegisterGuruPage
