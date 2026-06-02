"use client";

import { useState } from "react";
import { Shield, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Masuk ke Dashboard</CardTitle>
          <CardDescription>
            Gunakan akun admin untuk mengakses audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm bg-destructive/10 border border-destructive/25 text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2"
            >
              <LogIn size={14} />
              {isLoading ? "Masuk..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-1.5">
              <Shield size={11} className="text-primary" />
              <p className="text-[10px] text-muted-foreground">
                AAA Protocol Active · Bacarita v1.0
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
