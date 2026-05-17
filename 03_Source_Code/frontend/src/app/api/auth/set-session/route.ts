import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { role, token } = await req.json();

  const res = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === "production";

  res.cookies.set("role", role, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  });

  if (token) {
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 3600,
    });
  }

  return res;
}
