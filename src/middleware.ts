// src/middleware.ts
export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        // Protege TODO excepto rutas de login y auth
        "/((?!auth|api/auth).*)",
    ],
};
