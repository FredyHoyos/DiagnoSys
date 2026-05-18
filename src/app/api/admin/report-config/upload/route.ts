import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  if (session.user.role?.name !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { session };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (auth.error) return auth.error;

    const body = await request.json();
    const organizationUserId = Number(body.organizationUserId);
    const { fileName, contentType, base64 } = body;

    if (!organizationUserId || !base64 || !contentType) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowed.includes(contentType)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    const buf = Buffer.from(base64, "base64");
    if (buf.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 400 });
    }

    // Upsert report display config and save the logo bytes
    const url = `/api/admin/report-config/logo?organizationUserId=${organizationUserId}`;
    const saved = await prisma.reportDisplayConfig.upsert({
      where: { organizationUserId },
      create: {
        organizationUserId,
        logoData: buf,
        logoContentType: contentType,
        logoUrl: url,
      },
      update: {
        logoData: buf,
        logoContentType: contentType,
        logoUrl: url,
      },
      select: { organizationUserId: true },
    });

    return NextResponse.json({ url, saved }, { status: 200 });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
