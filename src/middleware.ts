// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
    // Opciones de next-auth
    {
        pages: {
            signIn: "/auth/card", // <- Aquí cambias la ruta de redirección
        },
    }
);

export const config = {
    matcher: [
        "/((?!auth|api/auth).*)", // protege todo excepto /auth y /api/auth
    ],
};
