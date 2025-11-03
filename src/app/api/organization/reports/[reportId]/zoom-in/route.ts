import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organization/reports/[reportId]/zoom-in
 * Get zoom-in forms for a specific report
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

        const userId = parseInt(session.user.id);
        const reportIdInt = parseInt(reportId);

        if (isNaN(reportIdInt)) {
            return NextResponse.json(
                { error: "Invalid report ID" },
                { status: 400 }
            );
        }

        // Verify report belongs to this user
        const report = await prisma.report.findFirst({
            where: {
                id: reportIdInt,
                userId
            },
            select: {
                id: true,
                name: true,
                version: true
            }
        });

        if (!report) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        // Get all published zoom-in forms
        const zoomInForms = await prisma.form.findMany({
            where: {
                isPublished: true,
                tag: 'zoom-in'
            },
            select: {
                id: true,
                name: true,
                description: true
            }
        });

        // Get personalized forms for this report to check completion status
        const personalizedForms = await prisma.personalizedForm.findMany({
            where: {
                reportId: reportIdInt,
                userId,
                baseForm: {
                    tag: 'zoom-in'
                }
            },
            select: {
                baseFormId: true,
                isCompleted: true,
                completedAt: true
            }
        });

        // Map forms with completion status
        const formsWithStatus = zoomInForms.map(form => {
            const personalizedForm = personalizedForms.find(pf => pf.baseFormId === form.id);
            
            return {
                id: form.id,
                name: form.name,
                description: form.description,
                isCompleted: personalizedForm?.isCompleted || false,
                completedAt: personalizedForm?.completedAt || null
            };
        });

        return NextResponse.json({
            zoomData: {
                reportId: report.id,
                reportName: report.name,
                version: report.version,
                forms: formsWithStatus
            },
            message: "Zoom-in data retrieved successfully"
        });

    } catch (error) {
        console.error("🚨 Error fetching zoom-in data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
