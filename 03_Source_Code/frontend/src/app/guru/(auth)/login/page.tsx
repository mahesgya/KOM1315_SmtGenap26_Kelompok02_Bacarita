"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthServices from "@/services/auth.services";
import { showToastError, showToastSuccess } from "@/components/utils/toast.utils";
import { useDispatch } from "react-redux";

const LoginGuru = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const response = await AuthServices.LoginGuru(email, password, dispatch);
    if (response.success) {
      showToastSuccess("Login berhasil!");
      router.push("/guru/beranda");
    } else if (response.success === false) {
      showToastError(response.error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-cover bg-center p-6" style={{ backgroundImage: "url('/assets/peran/bg-pilihperan.webp')" }}>
      <div className="w-full max-w-md bg-[#FBF8F2]/95 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-[30px] px-8 py-10 text-center">
        <h1 className="text-3xl font-extrabold text-[#5A3E2B] mb-2">Login Akun Guru</h1>
        <p className="text-[#5A3E2B]/80 mb-6">Yuk pantau progres murid!</p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <input
              type="email"
              placeholder="Alamat Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[12px] border border-[#DE954F] bg-white px-4 py-3 text-[#5A3E2B] placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[12px] border border-[#DE954F] bg-white px-4 py-3 text-[#5A3E2B] placeholder:text-[#B8A191] focus:outline-none focus:ring-2 focus:ring-[#DE954F]/60 transition"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[#B8A191] hover:text-[#8D6E52] transition">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="w-full bg-[#DE954F] hover:bg-[#B67432] text-white text-lg font-semibold py-3 rounded-[12px] shadow-md transition">
            Masuk
          </button>
        </form>

        <p className="mt-6 text-[#5A3E2B] text-sm font-semibold">
          Belum punya akun?{" "}
          <span onClick={() => router.push("/guru/daftar")} className="text-[#DE954F] hover:underline cursor-pointer">
            Daftar disini
          </span>
        </p>
      </div>
    </main>
  );
};

export default LoginGuru;
