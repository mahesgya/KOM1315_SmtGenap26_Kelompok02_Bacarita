"use client";

import { useState } from "react";
import { Shield, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Login gagal. Periksa email dan password.");
        return;
      }

      router.push("/");
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
        }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div>
            <p
              className="text-base font-bold leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              Bacarita
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Security Logs · Admin
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Masuk ke Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Gunakan akun admin untuk mengakses audit log.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            className="flex flex-col gap-1.5 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              className="rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-primary)",
              }}
            />
          </label>

          <label
            className="flex flex-col gap-1.5 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-primary)",
              }}
            />
          </label>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            <LogIn size={14} />
            {isLoading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--bg-border)" }}>
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-indigo-400" />
            <p className="text-[10px] text-indigo-400">
              AAA Protocol Active · Bacarita v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
