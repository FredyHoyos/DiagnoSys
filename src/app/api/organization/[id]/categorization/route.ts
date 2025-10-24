import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const organizationId = parseInt(params.id);
    const body = await req.json();
    const { opportunities, needs, problems, name } = body;

    // Creamos la sesión principal
    const session = await prisma.categorizationSession.create({
      data: {
        organizationId,
        name: name || `Categorización ${new Date().toLocaleDateString()}`,
        entries: {
          create: [
            ...(opportunities || []).map((item: any) => ({
              type: "OPPORTUNITY",
              name: item.name,
              color: item.color,
            })),
            ...(needs || []).map((item: any) => ({
              type: "NEED",
              name: item.name,
              color: item.color,
            })),
            ...(problems || []).map((item: any) => ({
              type: "PROBLEM",
              name: item.name,
              color: item.color,
            })),
          ],
        },
      },
      include: { entries: true },
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error al guardar" }, { status: 500 });
  }
}
