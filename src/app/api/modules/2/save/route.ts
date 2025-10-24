import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { opportunities, needs, problems } = await req.json();

    // Guardar oportunidades
    if (Array.isArray(opportunities) && opportunities.length > 0) {
      await prisma.opportunity.createMany({
        data: opportunities.map((o: any) => ({
          name: o.name,
          color: o.color || null,
          userId: user.id,
        })),
      });
    }

    // Guardar necesidades
    if (Array.isArray(needs) && needs.length > 0) {
      await prisma.need.createMany({
        data: needs.map((n: any) => ({
          name: n.name,
          color: n.color || null,
          userId: user.id,
        })),
      });
    }

    // Guardar problemas
    if (Array.isArray(problems) && problems.length > 0) {
      await prisma.problem.createMany({
        data: problems.map((p: any) => ({
          name: p.name,
          color: p.color || null,
          userId: user.id,
        })),
      });
    }

    return NextResponse.json({ message: "Data saved successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
