// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const user = req.nextauth.token;

    // Si no hay usuario autenticado, redirige a la página de autenticación
    if (!user) {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    // Bloquea rutas /admin o /api/admin si no es admin
    if ((pathname.startsWith("/dashboard/admin") || pathname.startsWith("/api/admin")) && user?.role?.name !== "admin") {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    // Bloquea rutas /consultant o /api/consultant si no es consultant
    if ((pathname.startsWith("/dashboard/consultant") || pathname.startsWith("/api/consultant")) && user?.role?.name !== "consultant") {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    // Bloquea rutas /organization o /api/organization si no es organization
    if ((pathname.startsWith("/dashboard/organization") || pathname.startsWith("/api/organization")) && user?.role?.name !== "organization") {
      return NextResponse.redirect(new URL("/auth/card", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/card", // Ruta de redirección en caso de no autenticación
    },
  }
);

export const config = {
  matcher: [
    "/((?!auth|api/auth).*)", // Protege todas las rutas excepto las de autenticación
  ],
};
