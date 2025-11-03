import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/organization/reports/[reportId]/complete
 * Mark a report as completed by the organization
 */
export async function POST(
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

        // Verify report exists and belongs to user
        const report = await prisma.report.findFirst({
            where: {
                id: reportIdInt,
                userId
            },
            include: {
                personalizedForms: {
                    select: {
                        id: true,
                        isCompleted: true
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

        // Check if all forms are completed
        const allFormsCompleted = report.personalizedForms.every(form => form.isCompleted);
        
        if (!allFormsCompleted) {
            return NextResponse.json(
                { error: "Cannot complete report: not all forms have been completed" },
                { status: 400 }
            );
        }

        // Update report as completed
        const updatedReport = await prisma.report.update({
            where: { id: reportIdInt },
            data: {
                isCompleted: true,
                completedAt: new Date()
            }
        });

        return NextResponse.json({
            report: {
                id: updatedReport.id,
                name: updatedReport.name,
                version: updatedReport.version,
                isCompleted: updatedReport.isCompleted,
                completedAt: updatedReport.completedAt
            },
            message: "Report completed successfully"
        });

    } catch (error) {
        console.error("🚨 Error completing report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
