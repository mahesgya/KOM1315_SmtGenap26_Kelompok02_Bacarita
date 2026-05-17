"use client";

import React, { JSX } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const Home = () => {
  const router = useRouter();

  return (
    <main
      className="verdana relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat text-center px-6"
      style={{
        backgroundImage: "url('/assets/beranda/bghome.webp')",
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      <div className="relative z-10 w-screen md:max-w-5xl text-white h-[100dvh] flex flex-col items-center justify-center">
        <motion.h1 className="text-3xl drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] mb-8 md:text-5xl lg:text-6xl font-extrabold md:mb-12 md:drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="text-[#F2E3D1]">BACARITA:</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B95F] via-[#DE954F] to-[#E5B95F]">Teman Baca yang Selalu Mendukungmu</span>
        </motion.h1>

        <motion.p className="text-center text-md mb-8 md:text-2xl lg:text-2xl font-medium text-white drop-shadow-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
          Platform belajar membaca yang adaptif dan menyenangkan, dirancang khusus untuk petualang cilik dengan disleksia.
        </motion.p>

        <motion.button onClick={() => router.push("/pilih-peran")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="bg-[#DE954F] text-white font-semibold text-md py-2 px-4 md:text-lg md:py-3 md:px-8 rounded-lg shadow-md transition">
          Mulai Sekarang
        </motion.button>

        <motion.div className="flex flex-wrap absolute bottom-4 items-center justify-center gap-2 mt-4 md:bottom-16 md:gap-6 md:mt-10 text-sm md:text-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}>
          <Feature color="bg-green-500" text="Didukung Teknologi Eye-Tracking" />
          <Feature color="bg-orange-400" text="Didukung Teknologi ASR" />
          <Feature color="bg-pink-400" text="Gamifikasi Motivatif" />
        </motion.div>
      </div>
    </main>
  );
};

function Feature({ color, text }: { color: string; text: string }): JSX.Element {
  return (
    <div className="flex items-center w-fit gap-2 bg-white/20 px-2 py-1 md:px-4 md:py-2 rounded-full md:w-fit backdrop-blur-sm shadow-sm">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] md:text-lg text-white font-medium">{text}</span>
    </div>
  );
}

export default Home;
