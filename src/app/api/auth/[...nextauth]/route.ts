import NextAuth, {
    type DefaultSession,
    type DefaultUser,
} from "next-auth";
import { authOptions } from "@/lib/auth-config";

/* ---------------------- EXTENSIÓN DE TIPOS ---------------------- */
declare module "next-auth" {
    interface User extends DefaultUser {
        rememberMe?: boolean;
        role?: {
            name: string;
            displayName: string;
        };
    }

    interface Session extends DefaultSession {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            rememberMe?: boolean;
            role?: {
                name: string;
                displayName: string;
            };
        };
        expires: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        rememberMe?: boolean;
        exp?: number;
        role?: {
            name: string;
            displayName: string;
        };
    }
}
/* ---------------------------------------------------------------- */

/* ------------------- EXPORTACIÓN DEL HANDLER -------------------- */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
/* ---------------------------------------------------------------- */
