// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const user = req.nextauth.token;

        // Bloquea rutas /admin o /api/admin si no es admin
        if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && user?.role?.name !== "admin") {
            return NextResponse.redirect(new URL("/auth/card", req.url));
        }

        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/auth/card", // <- Aquí cambias la ruta de redirección
        },
    }
);

export const config = {
    matcher: [
        "/((?!auth|api/auth).*)", // protege todo excepto login
    ],
};
