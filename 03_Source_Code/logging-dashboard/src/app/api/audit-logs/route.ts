import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACARITA_API_URL ?? process.env.NEXT_PUBLIC_BACARITA_API_URL ?? "";
const AUDIT_DASHBOARD_ACCESS_KEY = process.env.AUDIT_DASHBOARD_ACCESS_KEY ?? "";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json(
      {
        error:
          "BACARITA_API_URL belum dikonfigurasi di standalone dashboard.",
      },
      { status: 500 },
    );
  }

  if (!AUDIT_DASHBOARD_ACCESS_KEY) {
    return NextResponse.json(
      {
        error:
          "AUDIT_DASHBOARD_ACCESS_KEY belum dikonfigurasi di standalone dashboard.",
      },
      { status: 500 },
    );
  }

  const search = request.nextUrl.searchParams.toString();
  const targetUrl = `${normalizeBaseUrl(BACKEND_API_URL)}/auth/admin/audit-logs/standalone${search ? `?${search}` : ""}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "x-audit-dashboard-key": AUDIT_DASHBOARD_ACCESS_KEY,
      },
      cache: "no-store",
    });

    const payload = await response.json();

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Standalone dashboard gagal terhubung ke backend Bacarita.",
      },
      { status: 502 },
    );
  }
}
