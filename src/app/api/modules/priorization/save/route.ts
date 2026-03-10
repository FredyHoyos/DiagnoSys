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
  forceUpdate?: boolean;
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
    const {
      highPriority,
      mediumPriority,
      lowPriority,
      mediumPriority2,
      forceUpdate = false,
    } = body;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [highToday, mediumToday, lowToday, medium2Today] = await Promise.all([
      prisma.highPriority.count({
        where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.mediumPriority.count({
        where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.lowPriority.count({
        where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.mediumPriority2.count({
        where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
    ]);

    const hasTodayData = highToday + mediumToday + lowToday + medium2Today > 0;

    if (hasTodayData && !forceUpdate) {
      return NextResponse.json(
        {
          error: "You already saved prioritization data today.",
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    const cleanNames = (items?: BaseItemInput[]) =>
      (items ?? [])
        .map((item) => ({ name: item.name?.trim() ?? "" }))
        .filter((item) => item.name.length > 0);

    const cleanHighPriority = cleanNames(highPriority);
    const cleanMediumPriority = cleanNames(mediumPriority);
    const cleanLowPriority = cleanNames(lowPriority);
    const cleanMediumPriority2 = cleanNames(mediumPriority2);

    await prisma.$transaction(async (tx) => {
      if (hasTodayData) {
        await Promise.all([
          tx.highPriority.deleteMany({
            where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.mediumPriority.deleteMany({
            where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.lowPriority.deleteMany({
            where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.mediumPriority2.deleteMany({
            where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
        ]);
      }

      if (cleanHighPriority.length) {
        await tx.highPriority.createMany({
          data: cleanHighPriority.map((item) => ({
            name: item.name,
            userId: user.id,
          })),
        });
      }

      if (cleanMediumPriority.length) {
        await tx.mediumPriority.createMany({
          data: cleanMediumPriority.map((item) => ({
            name: item.name,
            userId: user.id,
          })),
        });
      }

      if (cleanLowPriority.length) {
        await tx.lowPriority.createMany({
          data: cleanLowPriority.map((item) => ({
            name: item.name,
            userId: user.id,
          })),
        });
      }

      if (cleanMediumPriority2.length) {
        await tx.mediumPriority2.createMany({
          data: cleanMediumPriority2.map((item) => ({
            name: item.name,
            userId: user.id,
          })),
        });
      }
    });

    return NextResponse.json({
      message: hasTodayData
        ? "Prioritization data updated successfully"
        : "Prioritization data saved successfully",
      updated: hasTodayData,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
