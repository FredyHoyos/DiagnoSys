import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

interface BaseItemInput {
  name: string;
  color?: string | null;
}

interface SaveRequestBody {
  opportunities?: BaseItemInput[];
  needs?: BaseItemInput[];
  problems?: BaseItemInput[];
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
    const { opportunities, needs, problems } = body;

    // Guardar oportunidades
    if (opportunities?.length) {
      await prisma.opportunity.createMany({
        data: opportunities.map((o) => ({
          name: o.name,
          color: o.color ?? null,
          userId: user.id,
        })),
      });
    }

    // Guardar necesidades
    if (needs?.length) {
      await prisma.need.createMany({
        data: needs.map((n) => ({
          name: n.name,
          color: n.color ?? null,
          userId: user.id,
        })),
      });
    }

    // Guardar problemas
    if (problems?.length) {
      await prisma.problem.createMany({
        data: problems.map((p) => ({
          name: p.name,
          color: p.color ?? null,
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
