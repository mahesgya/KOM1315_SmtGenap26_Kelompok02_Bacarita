import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === "production";

  res.cookies.set("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("role", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return res;
}
