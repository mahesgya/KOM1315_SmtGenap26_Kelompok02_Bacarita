import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <WifiOff className="w-16 h-16 mb-4 text-slate-500" />
      <h1 className="text-4xl font-bold mb-2">Anda Sedang Offline</h1>
      <p className="text-slate-300 max-w-md">
        Koneksi internet Anda terputus. Halaman yang Anda coba akses tidak tersimpan di cache. Silakan periksa koneksi Anda dan coba lagi.
      </p>
    </div>
  );
}
