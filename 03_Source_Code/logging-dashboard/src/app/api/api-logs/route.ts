import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACARITA_API_URL ?? process.env.NEXT_PUBLIC_BACARITA_API_URL ?? "";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json(
      { error: "BACARITA_API_URL belum dikonfigurasi." },
      { status: 500 },
    );
  }

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.toString();
  const targetUrl = `${normalizeBaseUrl(BACKEND_API_URL)}/auth/admin/api-logs${search ? `?${search}` : ""}`;

  try {
    const response = await fetch(targetUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Gagal terhubung ke backend Bacarita." },
      { status: 502 },
    );
  }
}
