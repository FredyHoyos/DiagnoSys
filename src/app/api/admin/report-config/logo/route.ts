import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const orgIdParam = request.nextUrl.searchParams.get("organizationUserId");
    const orgId = orgIdParam ? Number(orgIdParam) : null;
    if (!orgId) return NextResponse.json({ error: "organizationUserId required" }, { status: 400 });

    const cfg = await prisma.reportDisplayConfig.findUnique({
      where: { organizationUserId: orgId },
      select: { logoData: true, logoContentType: true },
    });

    if (!cfg || !cfg.logoData) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", cfg.logoContentType || "image/png");
    headers.set("Cache-Control", "public, max-age=3600");
    return new Response(Buffer.from(cfg.logoData as Uint8Array), { status: 200, headers });
  } catch (error) {
    console.error("Error serving logo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
