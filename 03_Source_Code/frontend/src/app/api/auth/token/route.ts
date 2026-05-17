import { NextRequest, NextResponse } from "next/server";

// BFF relay: reads the HttpOnly token cookie server-side and returns its value.
// Client-side JS cannot read HttpOnly cookies directly; this route provides
// a same-origin bridge so axios can attach the Bearer token to backend calls.
export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value ?? null;
  return NextResponse.json({ token });
}
