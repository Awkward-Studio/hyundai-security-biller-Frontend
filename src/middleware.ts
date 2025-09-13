// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const loginPath = "/";

  // Protected areas by prefix
  const protectedPrefixes = ["/biller", "/security", "/admin"];

  // Try to read & parse cookie safely
  const tokenStr = request.cookies.get("user")?.value;
  let role: string | null = null;

  if (tokenStr) {
    try {
      const parsed = JSON.parse(tokenStr);
      const labels = Array.isArray(parsed?.labels) ? parsed.labels : [];
      role = typeof labels[0] === "string" ? labels[0] : null;
    } catch {
      role = null; // malformed cookie -> treat as no user
    }
  }

  // Map each role to its home prefix
  const roleHome: Record<string, string> = {
    biller: "/biller",
    security: "/security",
    admin: "/admin",
   
  };

  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  // ---- No valid user: always send to login from anywhere ----
  if (!role) {
    if (path !== loginPath) {
      return NextResponse.redirect(new URL(loginPath, request.nextUrl));
    }
    return NextResponse.next();
  }

  // ---- Valid user exists ----
  const home = roleHome[role] ?? loginPath;

  // If they’re at login, send them to their home
  if (path === loginPath) {
    return NextResponse.redirect(new URL(home, request.nextUrl));
  }

  // If they’re in a protected area that doesn’t match their role, redirect to their home
  if (isProtected && !path.startsWith(home)) {
    return NextResponse.redirect(new URL(home, request.nextUrl));
  }

  // Otherwise, allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/biller/:path*",
    "/security/:path*",
    "/admin/:path*",
    "/",
  ],
};
