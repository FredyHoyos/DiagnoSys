import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ---------- EXTENSIÓN DE TIPOS ----------
declare module "next-auth" {
    interface User extends DefaultUser {
        rememberMe?: boolean;
    }

    interface Session extends DefaultSession {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            rememberMe?: boolean;
        };
        expires: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        rememberMe?: boolean;
        exp?: number;
    }
}
// ----------------------------------------

const prisma = new PrismaClient();

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                rememberMe: { label: "Remember me", type: "checkbox" }, // campo extra
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error("User not found");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                // Retornamos el usuario + rememberMe
                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    rememberMe: credentials.rememberMe === "on",
                };
            },
        }),
    ],
    pages: {
        signIn: "/auth/card", //  página de login
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user?.rememberMe) {
                token.rememberMe = true;
                token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 días
            } else if (user) {
                token.rememberMe = false;
                token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8; // 8 horas
            }
            return token;
        },
        async session({ session, token }) {
            if (typeof token.exp === "number") {
                session.expires = new Date(token.exp * 1000).toISOString();
            }
            if (typeof token.rememberMe === "boolean") {
                session.user.rememberMe = token.rememberMe;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
