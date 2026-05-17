import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { role } = await req.json();

  const res = NextResponse.json({ success: true });

  res.cookies.set("role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res;
}
