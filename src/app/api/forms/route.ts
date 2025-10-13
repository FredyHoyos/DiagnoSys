import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = session.user.role?.name === "admin";

    const forms = await prisma.form.findMany({
      where: isAdmin ? {} : { isPublished: true },
      include: {
        module: { select: { id: true, name: true } },
        categories: {
          include: {
            _count: {
              select: { items: true },
            },
          },
        },
        _count: {
          select: { categories: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
