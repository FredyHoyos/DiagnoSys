import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organization/reports
 * Get all reports for the authenticated organization
 */
export async function GET() {
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

        // Get all reports for this organization with stats
        const reports = await prisma.report.findMany({
            where: { userId },
            include: {
                personalizedForms: {
                    include: {
                        baseForm: {
                            select: {
                                id: true,
                                name: true,
                                tag: true
                            }
                        },
                        personalizedCategories: {
                            include: {
                                personalizedItems: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        personalizedForms: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Process reports with stats
        const processedReports = reports.map(report => {
            const zoomInForms = report.personalizedForms.filter(
                form => form.baseForm.tag === 'zoom-in'
            );
            const zoomOutForms = report.personalizedForms.filter(
                form => form.baseForm.tag === 'zoom-out'
            );

            const completedForms = report.personalizedForms.filter(form => form.isCompleted);
            const totalForms = report.personalizedForms.length;
            const completionRate = totalForms > 0 ? Math.round((completedForms.length / totalForms) * 100) : 0;

            return {
                id: report.id,
                name: report.name,
                version: report.version,
                isCompleted: report.isCompleted,
                completedAt: report.completedAt,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
                stats: {
                    totalForms,
                    completedForms: completedForms.length,
                    completionRate,
                    zoomInTotal: zoomInForms.length,
                    zoomInCompleted: zoomInForms.filter(f => f.isCompleted).length,
                    zoomOutTotal: zoomOutForms.length,
                    zoomOutCompleted: zoomOutForms.filter(f => f.isCompleted).length
                }
            };
        });

        return NextResponse.json({
            reports: processedReports,
            message: "Reports retrieved successfully"
        });

    } catch (error) {
        console.error("🚨 Error fetching reports:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/organization/reports
 * Create a new report for the authenticated organization
 */
export async function POST(request: NextRequest) {
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
        const { name } = await request.json();

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Report name is required" },
                { status: 400 }
            );
        }

        // Get the next version number for this organization and report name
        const existingReports = await prisma.report.findMany({
            where: {
                userId,
                name: name.trim()
            },
            select: { version: true },
            orderBy: { version: 'desc' },
            take: 1
        });

        const nextVersion = existingReports.length > 0 ? existingReports[0].version + 1 : 1;

        // Create the new report
        const newReport = await prisma.report.create({
            data: {
                name: name.trim(),
                version: nextVersion,
                userId
            }
        });

        // Get all published forms to create personalized forms for this report
        const publishedForms = await prisma.form.findMany({
            where: { isPublished: true },
            include: {
                categories: {
                    include: {
                        items: true
                    }
                }
            }
        });

        // Create personalized forms for this report
        const personalizedFormsData = publishedForms.map(form => ({
            name: form.name,
            baseFormId: form.id,
            userId,
            reportId: newReport.id
        }));

        if (personalizedFormsData.length > 0) {
            await prisma.personalizedForm.createMany({
                data: personalizedFormsData
            });
        }

        // Return the created report with stats
        const reportWithStats = {
            id: newReport.id,
            name: newReport.name,
            version: newReport.version,
            isCompleted: newReport.isCompleted,
            completedAt: newReport.completedAt,
            createdAt: newReport.createdAt,
            updatedAt: newReport.updatedAt,
            stats: {
                totalForms: publishedForms.length,
                completedForms: 0,
                completionRate: 0,
                zoomInTotal: publishedForms.filter(f => f.tag === 'zoom-in').length,
                zoomInCompleted: 0,
                zoomOutTotal: publishedForms.filter(f => f.tag === 'zoom-out').length,
                zoomOutCompleted: 0
            }
        };

        return NextResponse.json({
            report: reportWithStats,
            message: "Report created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("🚨 Error creating report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
