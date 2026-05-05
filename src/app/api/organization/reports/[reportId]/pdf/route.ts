import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { resolveScopedUserForDiagnostics, ScopedUserError } from "@/lib/consultant-scope";
import { withDefaultReportConfig } from "@/lib/report-config";
import { renderRadarChart } from "@/lib/report-charts";

function drawWrappedText(
  page: import("pdf-lib").PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  size: number,
  color = rgb(0, 0, 0)
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = page.getWidth() * 0.001 * testLine.length * size;
    if (width > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, color });
      line = word;
      cursorY -= lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: cursorY, size, color });
    cursorY -= lineHeight;
  }

  return cursorY;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await context.params;
    const reportIdInt = parseInt(reportId, 10);

    if (Number.isNaN(reportIdInt)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const isOrganization = session.user.role?.name === "organization";
    const isConsultant = session.user.role?.name === "consultant";

    if (!isOrganization && !isConsultant) {
      return NextResponse.json({ error: "Organization access required" }, { status: 403 });
    }

    let userId = parseInt(session.user.id, 10);
    if (isConsultant) {
      const organizationId = request.nextUrl.searchParams.get("organizationId");
      const scopedUser = await resolveScopedUserForDiagnostics(session.user.id, organizationId);
      userId = scopedUser.targetUserId;
    }

    const report = await prisma.report.findFirst({
      where: { id: reportIdInt, userId },
      select: {
        id: true,
        name: true,
        version: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const [categorization, high, medium, low, medium2, configRaw] = await Promise.all([
      prisma.opportunity.findMany({ where: { reportId: reportIdInt, userId }, select: { name: true }, orderBy: { id: "asc" } }),
      prisma.highPriority.findMany({ where: { reportId: reportIdInt, userId }, select: { name: true }, orderBy: { id: "asc" } }),
      prisma.mediumPriority.findMany({ where: { reportId: reportIdInt, userId }, select: { name: true }, orderBy: { id: "asc" } }),
      prisma.lowPriority.findMany({ where: { reportId: reportIdInt, userId }, select: { name: true }, orderBy: { id: "asc" } }),
      prisma.mediumPriority2.findMany({ where: { reportId: reportIdInt, userId }, select: { name: true }, orderBy: { id: "asc" } }),
      prisma.reportDisplayConfig.findUnique({
        where: { organizationUserId: userId },
        select: {
          showExecutiveSummary: true,
          showRadar: true,
          showCategorization: true,
          showPrioritization: true,
          showActionPlan: true,
          showScaleLegend: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          headerTitle: true,
          headerSubtitle: true,
        },
      }),
    ]);

    // Also fetch personalized forms to render zoom-in / zoom-out charts like radar-data route
    const personalizedForms = await prisma.personalizedForm.findMany({
      where: {
        userId: userId,
        auditId: null,
        reportId: reportIdInt,
      },
      include: {
        baseForm: {
          select: {
            id: true,
            name: true,
            tag: true,
            module: { select: { id: true, name: true } },
          },
        },
        personalizedCategories: {
          include: { personalizedItems: { select: { id: true, name: true, score: true, isCustom: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // group latest forms by module+baseForm
    const latestFormsByModule = new Map();
    personalizedForms.forEach((form) => {
      const moduleId = form.baseForm.module.id;
      const baseFormId = form.baseFormId;
      const key = `${moduleId}-${baseFormId}`;
      if (!latestFormsByModule.has(key) || new Date(form.updatedAt) > new Date(latestFormsByModule.get(key).updatedAt)) {
        latestFormsByModule.set(key, form);
      }
    });

    const latestForms = Array.from(latestFormsByModule.values());

    const processFormsForRadar = (forms: any[]) => {
      return forms.map((form) => {
        const categoryData = form.personalizedCategories.map((category: any) => {
          const items: any[] = category.personalizedItems || [];
          const totalScore = items.reduce((s: number, it: any) => s + (it.score || 0), 0);
          const avgScore = items.length > 0 ? totalScore / items.length : 0;
          return {
            name: category.name,
            score: Math.round(avgScore * 100) / 100,
            maxScore: 5,
            itemCount: items.length,
            totalScore,
          };
        });

        const totalItems = form.personalizedCategories.reduce((s: number, c: any) => s + (c.personalizedItems?.length || 0), 0);
        const totalScore = form.personalizedCategories.reduce(
          (s: number, c: any) => s + (c.personalizedItems?.reduce((ss: number, it: any) => ss + (it.score || 0), 0) || 0),
          0
        );
        const avgScore = totalItems > 0 ? totalScore / totalItems : 0;

        return {
          id: form.id,
          name: form.name,
          module: form.baseForm.module.name,
          isCompleted: form.isCompleted,
          completedAt: form.completedAt,
          categoryData,
          stats: {
            totalItems,
            totalScore,
            avgScore: Math.round(avgScore * 100) / 100,
            maxPossibleScore: totalItems * 5,
            completionPercentage: totalItems > 0 ? Math.round((avgScore / 5) * 100) : 0,
          },
        };
      });
    };

    const zoomInForms = latestForms.filter((f) => f.baseForm.module.name.toLowerCase().includes("zoom in"));
    const zoomOutForms = latestForms.filter((f) => f.baseForm.module.name.toLowerCase().includes("zoom out"));

    const zoomInData = processFormsForRadar(zoomInForms);
    const zoomOutData = processFormsForRadar(zoomOutForms);

    const config = withDefaultReportConfig(
      configRaw
        ? {
            showExecutiveSummary: configRaw.showExecutiveSummary,
            showRadar: configRaw.showRadar,
            showCategorization: configRaw.showCategorization,
            showPrioritization: configRaw.showPrioritization,
            showActionPlan: configRaw.showActionPlan,
            showScaleLegend: configRaw.showScaleLegend,
            logoUrl: configRaw.logoUrl,
            primaryColor: configRaw.primaryColor ?? undefined,
            secondaryColor: configRaw.secondaryColor ?? undefined,
            headerTitle: configRaw.headerTitle ?? undefined,
            headerSubtitle: configRaw.headerSubtitle,
          }
        : null
    );

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const titleColor = rgb(0.18, 0.39, 0.28);
    const dark = rgb(0.12, 0.12, 0.12);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    // Try to embed logo at top-right if provided
    if (config.logoUrl) {
      try {
        const logoSource = config.logoUrl.startsWith("/") ? `${request.nextUrl.origin}${config.logoUrl}` : config.logoUrl;
        const logoResp = await fetch(logoSource);
        if (logoResp.ok) {
          const contentType = logoResp.headers.get("content-type") || "image/png";
          const logoBuffer = await logoResp.arrayBuffer();
          let logoImage: import("pdf-lib").PDFFont | any = null;
          if (contentType.includes("png")) {
            logoImage = await pdf.embedPng(logoBuffer as any);
          } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
            logoImage = await pdf.embedJpg(logoBuffer as any);
          }

          if (logoImage) {
            const logoWidth = 96;
            const ratio = (logoImage.height || 32) / (logoImage.width || 96);
            const logoHeight = Math.round(logoWidth * ratio);
            const logoX = 595 - 40 - logoWidth; // right margin
            const logoY = y - logoHeight;
            page.drawImage(logoImage, { x: logoX, y: logoY, width: logoWidth, height: logoHeight });
          }
        } else {
          console.warn("Logo fetch failed with status", logoResp.status, logoSource);
        }
      } catch (err) {
        console.error("Error fetching or embedding logo:", err, config.logoUrl);
      }
    }

    page.drawText(config.headerTitle, { x: 40, y, size: 20, font: fontBold, color: titleColor });
    y -= 24;

    if (config.headerSubtitle) {
      page.drawText(config.headerSubtitle, { x: 40, y, size: 11, font, color: dark });
      y -= 22;
    }

    page.drawText(`Reporte: ${report.name} (v${report.version})`, { x: 40, y, size: 11, font, color: dark });
    y -= 16;
    page.drawText(`Organización: ${report.user.name} - ${report.user.email}`, { x: 40, y, size: 11, font, color: dark });
    y -= 16;
    page.drawText(`Fecha: ${new Date(report.createdAt).toLocaleString("es-CO")}`, { x: 40, y, size: 11, font, color: dark });
    y -= 28;

    if (config.showExecutiveSummary) {
      page.drawText("Resumen Ejecutivo", { x: 40, y, size: 14, font: fontBold, color: titleColor });
      y -= 18;
      y = drawWrappedText(
        page,
        "Este informe consolida los resultados del diagnóstico digital, incluyendo categorización de hallazgos y priorización de acciones.",
        40,
        y,
        500,
        14,
        10
      );
      y -= 8;
    }
    // Insert radar chart image if requested
        if (config.showRadar && y > 150) {
      try {
        const labels = ["Alta","Media(Impacto)","Media(Urgencia)","Baja","Oportunidades"];
        const values = [high.length, medium.length, medium2.length, low.length, categorization.length];
        const imgBuffer = await renderRadarChart(labels, values, 520, 240);
        const pngImage = await pdf.embedPng(imgBuffer);
        const imgWidth = 480;
        const imgHeight = (240 / 520) * imgWidth;
        const imgTopY = y - imgHeight;
        page.drawImage(pngImage, { x: 56, y: imgTopY, width: imgWidth, height: imgHeight });
        y = imgTopY - 8;
      } catch (err) {
        console.error("Error rendering radar chart (ChartJS failed), falling back to simple bars:", err);
        // Fallback: draw simple horizontal bars representing values
        const labels = ["Alta","Media(Impacto)","Media(Urgencia)","Baja","Oportunidades"];
        const values = [high.length, medium.length, medium2.length, low.length, categorization.length];
        const barX = 56;
        let barY = y - 12;
        const barWidth = 480;
        const barHeight = 16;
        const maxVal = Math.max(5, ...values);
        for (let i = 0; i < labels.length; i++) {
          const lv = values[i] ?? 0;
          const w = (lv / maxVal) * barWidth;
          page.drawText(labels[i], { x: barX, y: barY + 4, size: 10, font, color: dark });
          page.drawRectangle({ x: barX + 120, y: barY, width: w, height: barHeight, color: rgb(0.18, 0.39, 0.28) });
          page.drawText(String(lv), { x: barX + 120 + w + 6, y: barY + 4, size: 9, font, color: dark });
          barY -= barHeight + 8;
        }
        y = barY - 8;
      }
    }
    // Render individual zoom-in charts
    const ensureSpace = (needed: number): any => {
      if (y - needed < 60) {
        const newPage = pdf.addPage([595, 842]);
        y = 800;
        return newPage;
      }
      return page;
    };

    if (config.showRadar) {
      // Render zoom-in forms charts
      if (zoomInData.length > 0) {
        page.drawText("Gráficas Zoom In", { x: 40, y, size: 14, font: fontBold, color: titleColor });
        y -= 20;
        for (const form of zoomInData) {
          const labels = form.categoryData.map((c: any) => c.name);
          const values = form.categoryData.map((c: any) => c.score);
          try {
            const imgBuf = await renderRadarChart(labels, values, 520, 240);
            const pngImage = await pdf.embedPng(imgBuf);
            const imgWidth = 480;
            const imgHeight = (240 / 520) * imgWidth;
            if (y - imgHeight < 80) {
              const newPg = pdf.addPage([595, 842]);
              y = 800;
              newPg.drawText(`${form.module} - ${form.name}`, { x: 40, y: y, size: 11, font: fontBold, color: dark });
              y -= 18;
              newPg.drawImage(pngImage, { x: 56, y: y - imgHeight, width: imgWidth, height: imgHeight });
              y -= imgHeight + 12;
            } else {
              page.drawText(`${form.module} - ${form.name}`, { x: 40, y: y, size: 11, font: fontBold, color: dark });
              y -= 18;
              page.drawImage(pngImage, { x: 56, y: y - imgHeight, width: imgWidth, height: imgHeight });
              y -= imgHeight + 12;
            }
          } catch (err) {
            console.error("Error rendering zoom-in chart for form:", form.name, err);
          }
        }
      }

      // Render zoom-out forms charts
      if (zoomOutData.length > 0) {
        page.drawText("Gráficas Zoom Out", { x: 40, y, size: 14, font: fontBold, color: titleColor });
        y -= 20;
        for (const form of zoomOutData) {
          const labels = form.categoryData.map((c: any) => c.name);
          const values = form.categoryData.map((c: any) => c.score);
          try {
            const imgBuf = await renderRadarChart(labels, values, 520, 240);
            const pngImage = await pdf.embedPng(imgBuf);
            const imgWidth = 480;
            const imgHeight = (240 / 520) * imgWidth;
            if (y - imgHeight < 80) {
              const newPg = pdf.addPage([595, 842]);
              y = 800;
              newPg.drawText(`${form.module} - ${form.name}`, { x: 40, y: y, size: 11, font: fontBold, color: dark });
              y -= 18;
              newPg.drawImage(pngImage, { x: 56, y: y - imgHeight, width: imgWidth, height: imgHeight });
              y -= imgHeight + 12;
            } else {
              page.drawText(`${form.module} - ${form.name}`, { x: 40, y: y, size: 11, font: fontBold, color: dark });
              y -= 18;
              page.drawImage(pngImage, { x: 56, y: y - imgHeight, width: imgWidth, height: imgHeight });
              y -= imgHeight + 12;
            }
          } catch (err) {
            console.error("Error rendering zoom-out chart for form:", form.name, err);
          }
        }
      }
    }

    if (config.showCategorization) {
      page.drawText("Categorización", { x: 40, y, size: 14, font: fontBold, color: titleColor });
      y -= 16;
      page.drawText(`Oportunidades: ${categorization.length}`, { x: 44, y, size: 10, font, color: dark });
      y -= 16;
    }

    if (config.showPrioritization) {
      page.drawText("Priorización", { x: 40, y, size: 14, font: fontBold, color: titleColor });
      y -= 16;
      page.drawText(`Alta prioridad: ${high.length}`, { x: 44, y, size: 10, font, color: dark });
      y -= 14;
      page.drawText(`Media (alto impacto): ${medium.length}`, { x: 44, y, size: 10, font, color: dark });
      y -= 14;
      page.drawText(`Media (alta urgencia): ${medium2.length}`, { x: 44, y, size: 10, font, color: dark });
      y -= 14;
      page.drawText(`Baja prioridad: ${low.length}`, { x: 44, y, size: 10, font, color: dark });
      y -= 18;
    }

    if (config.showActionPlan) {
      page.drawText("Plan de Acción", { x: 40, y, size: 14, font: fontBold, color: titleColor });
      y -= 16;
      const actions = [
        ...high.map((item) => ({ name: item.name, level: "Alta prioridad" })),
        ...medium.map((item) => ({ name: item.name, level: "Media (alto impacto)" })),
        ...medium2.map((item) => ({ name: item.name, level: "Media (alta urgencia)" })),
        ...low.map((item) => ({ name: item.name, level: "Baja prioridad" })),
      ];

      if (actions.length === 0) {
        page.drawText("Sin acciones priorizadas para este reporte.", { x: 44, y, size: 10, font, color: dark });
      } else {
        for (let i = 0; i < actions.length && y > 80; i++) {
          const item = actions[i];
          y = drawWrappedText(page, `${i + 1}. ${item.name} (${item.level})`, 44, y, 500, 13, 10);
        }
      }
    }

    if (config.showScaleLegend && y > 70) {
      y -= 18;
      page.drawText("Escala de referencia: 1 (muy bajo) a 5 (muy alto)", {
        x: 40,
        y,
        size: 10,
        font,
        color: dark,
      });
    }

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-${report.id}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof ScopedUserError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error creating report PDF:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
