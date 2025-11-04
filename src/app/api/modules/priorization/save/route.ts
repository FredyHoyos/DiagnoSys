import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

interface BaseItemInput {
  name: string;
}

interface SaveRequestBody {
  highPriority?: BaseItemInput[];
  mediumPriority?: BaseItemInput[];
  lowPriority?: BaseItemInput[];
  mediumPriority2?: BaseItemInput[]; // segundo grupo "Medium priority"
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: SaveRequestBody = await req.json();
    const { highPriority, mediumPriority, lowPriority, mediumPriority2 } = body;

    // Guardar High priority
    if (highPriority?.length) {
      await prisma.highPriority.createMany({
        data: highPriority.map((item) => ({
          name: item.name,
          userId: user.id,
        })),
      });
    }

    // Guardar Medium priority
    if (mediumPriority?.length) {
      await prisma.mediumPriority.createMany({
        data: mediumPriority.map((item) => ({
          name: item.name,
          userId: user.id,
        })),
      });
    }

    // Guardar Low priority
    if (lowPriority?.length) {
      await prisma.lowPriority.createMany({
        data: lowPriority.map((item) => ({
          name: item.name,
          userId: user.id,
        })),
      });
    }

    // Guardar segundo grupo Medium priority
    if (mediumPriority2?.length) {
      await prisma.mediumPriority2.createMany({
        data: mediumPriority2.map((item) => ({
          name: item.name,
          userId: user.id,
        })),
      });
    }

    return NextResponse.json({ message: "Data saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
