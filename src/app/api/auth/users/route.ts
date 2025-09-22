import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
