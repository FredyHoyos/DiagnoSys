// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const user = req.nextauth.token;

    // Ignorar archivos estáticos y rutas públicas
    const PUBLIC_FILE = /\.(.*)$/;
    const isPublicRoute = [
      "/auth",
      "/auth/card",
      "/api/auth",
      "/favicon.ico",
      "/logo.svg",
    ].some((path) => pathname.startsWith(path));

    const isStaticFile = PUBLIC_FILE.test(pathname);

    if (isPublicRoute || isStaticFile) {
      return NextResponse.next();
    }

    // Si no hay usuario autenticado, redirige a login
    if (!user) {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    // Rutas protegidas por rol
    if (
      (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/api/admin")) &&
      user?.role?.name !== "admin"
    ) {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    if (
      (pathname.startsWith("/dashboard/consultant") || pathname.startsWith("/api/consultant")) &&
      user?.role?.name !== "consultant"
    ) {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    if (
      (pathname.startsWith("/dashboard/organization") || pathname.startsWith("/api/organization")) &&
      user?.role?.name !== "organization"
    ) {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/card",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - auth (authentication pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (static assets)
     */
    "/((?!api/auth|auth|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};

