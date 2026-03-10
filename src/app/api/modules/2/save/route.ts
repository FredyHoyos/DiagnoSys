import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

interface BaseItemInput {
  name: string;
}

interface SaveRequestBody {
  opportunities?: BaseItemInput[];
  needs?: BaseItemInput[];
  problems?: BaseItemInput[];
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
    const { opportunities, needs, problems, forceUpdate = false } = body;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [opportunitiesToday, needsToday, problemsToday] = await Promise.all([
      prisma.opportunity.count({
        where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.need.count({
        where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.problem.count({
        where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
    ]);

    const hasTodayData = opportunitiesToday + needsToday + problemsToday > 0;

    if (hasTodayData && !forceUpdate) {
      return NextResponse.json(
        {
          error: "You already saved categorization data today.",
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    const cleanNames = (items?: BaseItemInput[]) =>
      (items ?? [])
        .map((item) => ({ name: item.name?.trim() ?? "" }))
        .filter((item) => item.name.length > 0);

    const cleanOpportunities = cleanNames(opportunities);
    const cleanNeeds = cleanNames(needs);
    const cleanProblems = cleanNames(problems);

    await prisma.$transaction(async (tx) => {
      if (hasTodayData) {
        await Promise.all([
          tx.opportunity.deleteMany({
            where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.need.deleteMany({
            where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.problem.deleteMany({
            where: { userId: user.id, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
        ]);
      }

      if (cleanOpportunities.length) {
        await tx.opportunity.createMany({
          data: cleanOpportunities.map((o) => ({
            name: o.name,
            userId: user.id,
          })),
        });
      }

      if (cleanNeeds.length) {
        await tx.need.createMany({
          data: cleanNeeds.map((n) => ({
            name: n.name,
            userId: user.id,
          })),
        });
      }

      if (cleanProblems.length) {
        await tx.problem.createMany({
          data: cleanProblems.map((p) => ({
            name: p.name,
            userId: user.id,
          })),
        });
      }
    });

    return NextResponse.json({
      message: hasTodayData
        ? "Categorization data updated successfully"
        : "Categorization data saved successfully",
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
