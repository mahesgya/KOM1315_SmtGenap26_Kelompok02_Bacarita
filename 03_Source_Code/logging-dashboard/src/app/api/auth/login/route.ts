import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACARITA_API_URL ?? process.env.NEXT_PUBLIC_BACARITA_API_URL ?? "";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json(
      { error: "BACARITA_API_URL belum dikonfigurasi." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${normalizeBaseUrl(BACKEND_API_URL)}/auth/admins/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as {
      data?: { token?: string };
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message ?? "Email atau password salah." },
        { status: response.status },
      );
    }

    const token = payload?.data?.token;
    if (!token) {
      return NextResponse.json(
        { error: "Token tidak ditemukan dalam response." },
        { status: 500 },
      );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("auth_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Gagal terhubung ke backend." },
      { status: 502 },
    );
  }
}
