import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        // Buscar token en DB
        const resetToken = await prisma.resetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 400 }
            );
        }

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar contraseña del usuario
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        // Eliminar todos los tokens del usuario (limpieza extra)
        await prisma.resetToken.deleteMany({
            where: { userId: resetToken.userId },
        });

        return NextResponse.json(
            { message: "Password reset successful" },
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
