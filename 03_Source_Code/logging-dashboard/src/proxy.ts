import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.BACARITA_API_URL ?? process.env.NEXT_PUBLIC_BACARITA_API_URL ?? ""
).replace(/\/+$/, "");

// Map dari path lokal → path backend
const PROXY_ROUTES: Record<string, string> = {
  "/api/audit-logs": "/auth/admin/audit-logs/standalone",
  "/api/api-logs":   "/auth/admin/api-logs",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // ── Proxy data routes ────────────────────────────────────────────────────
  const backendPath = PROXY_ROUTES[pathname];
  if (backendPath) {
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }
    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: "BACARITA_API_URL belum dikonfigurasi di server." },
        { status: 500 },
      );
    }

    const search = request.nextUrl.searchParams.toString();
    const target = `${BACKEND_URL}${backendPath}${search ? `?${search}` : ""}`;

    try {
      const res = await fetch(target, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await res.json();
      return NextResponse.json(payload, { status: res.status });
    } catch {
      return NextResponse.json({ error: "Gagal terhubung ke backend." }, { status: 502 });
    }
  }

  // ── Auth guard untuk halaman ──────────────────────────────────────────────
  const isLoginPage = pathname === "/login";

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/audit-logs",
    "/api/api-logs",
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
