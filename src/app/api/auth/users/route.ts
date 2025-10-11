import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma"; //  Usa la instancia global
import bcrypt from "bcryptjs";

/**
 * GET /api/users
 * Solo el admin puede listar todos los usuarios.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role?.name !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only the administrator can list users." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Error fetching users", details: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Solo puede usarse si el usuario está autenticado.
 * - Si es admin → puede actualizar cualquier usuario.
 * - Si no es admin → solo puede actualizar su propio perfil.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. You must log in." },
        { status: 401 }
      );
    }

    const { email, name, password } = await req.json();

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validar permisos
    const isAdmin = session.user.role?.name === "admin";
    const isSelf = session.user.email === email;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Unauthorized to modify this user." },
        { status: 403 }
      );
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        name,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });

    return NextResponse.json(
      { message: "Profile updated successfully.", user: updatedUser },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
