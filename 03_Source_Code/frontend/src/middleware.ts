import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "students" | "parents" | "teachers" | "admins" | "curators";

const AUTH_PATHS: Record<Role, string[]> = {
  students: ["/siswa/login"],
  parents: ["/orang-tua/login"],
  teachers: ["/guru/login", "/guru/daftar"],
  admins: ["/admin/login"],
  curators: ["/kurator/login"],
};

const HOME_PATH: Record<Role, string> = {
  students: "/siswa/beranda",
  parents: "/orang-tua/beranda",
  teachers: "/guru/beranda",
  admins: "/admin/beranda",
  curators: "/kurator/beranda",
};

const PROTECTED_PREFIX = ["/siswa", "/orang-tua", "/guru", "/admin", "/kurator"];

function requiredRoleForPath(path: string): Role | null {
  if (path.startsWith("/siswa")) return "students";
  if (path.startsWith("/orang-tua")) return "parents";
  if (path.startsWith("/guru")) return "teachers";
  if (path.startsWith("/admin")) return "admins";
  if (path.startsWith("/kurator")) return "curators";
  return null;
}

function isAnyLoginPath(path: string) {
  return Object.values(AUTH_PATHS).some(paths => paths.includes(path));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value as Role | undefined;
  const required = requiredRoleForPath(pathname);

  if (!PROTECTED_PREFIX.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (token && role && AUTH_PATHS[role].includes(pathname)) {
    return NextResponse.redirect(new URL(HOME_PATH[role], req.url));
  }

  if (isAnyLoginPath(pathname)) {
    return NextResponse.next();
  }

  if (!token || !required) {
    const fallback = required ? AUTH_PATHS[required][0] : "/";
    return NextResponse.redirect(new URL(fallback, req.url));
  }

  if (role && role !== required) {
    return NextResponse.redirect(new URL(HOME_PATH[role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/siswa/:path*", "/orang-tua/:path*", "/guru/:path*", "/admin/:path*", "/kurator/:path*"],
};
