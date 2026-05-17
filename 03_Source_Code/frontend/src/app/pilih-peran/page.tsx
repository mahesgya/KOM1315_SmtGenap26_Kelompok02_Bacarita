"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

const PilihPeranPage = () => {
  const router = useRouter();

  return (
    <main className="relative min-h-[100dvh] px-5 pt-safe pb-safe flex items-center justify-center text-center" style={{ backgroundImage: "url('/assets/peran/bg-pilihperan.webp')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-6xl py-8">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#3B2A22] drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]">
          Selamat Datang!
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.45 }} className="mt-2 md:mt-3 text-lg md:text-xl text-[#3B2A22]/90 text-balance">
          Yuk pilih peran kamu!
        </motion.p>

        <section className="mt-6 md:mt-10 grid grid-cols-1 gap-4 md:gap-16 sm:grid-cols-2 lg:grid-cols-3">
          <RoleCard title="Orang Tua" desc="Dukung kemajuan dan dampingi anak belajar!" img="/assets/peran/orangtua.webp" onClick={() => router.push("/orang-tua/login")} />
          <RoleCard title="Siswa" desc="Mulai petualangan ceritamu sekarang!" img="/assets/peran/siswa.webp" onClick={() => router.push("/siswa/login")} />
          <RoleCard title="Guru" desc="Pantau kemajuan dan kreativitas para murid!" img="/assets/peran/guru.webp" onClick={() => router.push("/guru/login")} />
        </section>
      </div>
    </main>
  );
};

type RoleCardProps = {
  title: string;
  desc: string;
  img: string;
  onClick: () => void;
};

function RoleCard({ title, desc, img, onClick }: RoleCardProps) {
  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="
        group relative w-full h-[300px] md:w-full md:h-[420px]
        rounded-[32px] bg-[#F8F5EC] backdrop-blur-xl
        ring-1 ring-[rgba(71,59,46,0.08)]  
        transition-transform
      "
    >
      <span
        aria-hidden
        className="
          pointer-events-none absolute inset-x-0 top-0 h-12
          rounded-t-[32px]
          bg-gradient-to-b from-white/70 to-transparent
        "
      />

      <span
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-gradient-to-br from-white/40 via-white/10 to-transparent
          opacity-[0.10] -rotate-2 rounded-[32px]
        "
      />

      <div className="relative z-10 flex  flex-col items-center text-center px-6 py-7 space-y-4 md:px-8 md:py-8">
        <div
          className="
            relative w-20 h-20 md:w-24 md:h-24 lg:w-28 md:h-28 grid place-items-center
            rounded-full bg-white/95 ring-4 ring-white/70
            shadow-[0_6px_18px_rgba(0,0,0,0.18)]
          "
        >
          <Image src={img} alt={title} fill sizes="96px" className="object-contain" />
        </div>

        <h3
          className="
          mt-5 text-2xl md:text-3xl font-extrabold text-[#3B2A22]
          drop-shadow-[0_2px_0_rgba(255,255,255,0.85)]
        "
        >
          {title}
        </h3>

        <p
          className="
          mt-3 text-base md:text-lg leading-relaxed text-[#3B2A22]/90
          max-w-[30ch]
        "
        >
          {desc}
        </p>
      </div>
    </motion.button>
  );
}

export default PilihPeranPage;
