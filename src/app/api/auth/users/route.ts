import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            name: true,
            displayName: true,
          }
        }
      }
    });
    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { error: "Error fetching users", details: message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        name,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });

    return NextResponse.json({ message: "Perfil actualizado", user: updatedUser });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}