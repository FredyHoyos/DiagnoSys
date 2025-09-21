import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendResetEmail } from "@/lib/mail"; // Función para enviar emails

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json(
                { error: "Non-registered user" },
                { status: 404 }
            );
        }


        // Generar token aleatorio
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 minutos

        // Guardar token en tabla ResetToken
        await prisma.resetToken.create({
            data: {
                token,
                expiresAt: expiry,
                userId: user.id,
            },
        });

        // Construir link de reseteo de contraseña (frontend)
        // Ojo: aquí debes usar la URL del FRONT, no del API
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

        // Enviar email real
        console.log("📧 Sending email to:", user.email);
        await sendResetEmail(user.email, user.name || "User", resetLink);

        return NextResponse.json(
            { message: "If this email exists, we sent instructions ✉️" },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
