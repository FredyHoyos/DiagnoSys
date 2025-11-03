import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organization/reports/[reportId]/zoom-out
 * Get zoom-out forms for a specific report
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ reportId: string }> }
) {
    const { reportId } = await context.params;
    
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        if (session.user.role?.name !== 'organization') {
            return NextResponse.json(
                { error: "Organization access required" },
                { status: 403 }
            );
        }

        const reportIdInt = parseInt(reportId);
        const userId = parseInt(session.user.id);

        if (isNaN(reportIdInt)) {
            return NextResponse.json(
                { error: "Invalid report ID" },
                { status: 400 }
            );
        }

        // Get report with zoom-out forms
        const report = await prisma.report.findFirst({
            where: {
                id: reportIdInt,
                userId
            },
            include: {
                personalizedForms: {
                    where: {
                        baseForm: {
                            tag: 'zoom-out'
                        }
                    },
                    include: {
                        baseForm: {
                            select: {
                                id: true,
                                name: true,
                                tag: true
                            }
                        }
                    }
                }
            }
        });

        if (!report) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        // Format zoom-out forms
        const zoomOutForms = report.personalizedForms.map(form => ({
            id: form.id,
            name: form.name,
            isCompleted: form.isCompleted,
            completedAt: form.completedAt
        }));

        const zoomData = {
            reportId: report.id,
            reportName: report.name,
            version: report.version,
            forms: zoomOutForms
        };

        return NextResponse.json({
            zoomData,
            message: "Zoom-out data retrieved successfully"
        });

    } catch (error) {
        console.error("🚨 Error fetching zoom-out data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
