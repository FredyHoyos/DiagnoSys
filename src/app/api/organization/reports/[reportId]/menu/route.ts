import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organization/reports/[reportId]/menu
 * Get report data for the menu page showing zoom options and forms
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

        // Fetch report with forms and their completion status
        const report = await prisma.report.findFirst({
            where: {
                id: reportIdInt,
                userId
            },
            include: {
                personalizedForms: {
                    include: {
                        baseForm: {
                            select: {
                                id: true,
                                name: true,
                                tag: true,
                                module: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        personalizedCategories: {
                            include: {
                                personalizedItems: {
                                    select: {
                                        id: true,
                                        score: true
                                    }
                                }
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

        // Get all published forms to check what should be available
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

        // Separate forms by zoom type and calculate stats
        const zoomInForms = publishedForms
            .filter(form => form.tag === 'zoom-in')
            .map(baseForm => {
                const personalizedForm = report.personalizedForms.find(
                    pf => pf.baseFormId === baseForm.id
                );

                const totalItems = baseForm.categories.reduce(
                    (sum, cat) => sum + cat.items.length, 0
                );

                const completedItems = personalizedForm 
                    ? personalizedForm.personalizedCategories.reduce(
                        (sum, cat) => sum + cat.personalizedItems.length, 0
                    )
                    : 0;

                return {
                    id: baseForm.id,
                    name: baseForm.name,
                    isCompleted: personalizedForm?.isCompleted || false,
                    totalItems,
                    completedItems
                };
            });

        const zoomOutForms = publishedForms
            .filter(form => form.tag === 'zoom-out')
            .map(baseForm => {
                const personalizedForm = report.personalizedForms.find(
                    pf => pf.baseFormId === baseForm.id
                );

                const totalItems = baseForm.categories.reduce(
                    (sum, cat) => sum + cat.items.length, 0
                );

                const completedItems = personalizedForm 
                    ? personalizedForm.personalizedCategories.reduce(
                        (sum, cat) => sum + cat.personalizedItems.length, 0
                    )
                    : 0;

                return {
                    id: baseForm.id,
                    name: baseForm.name,
                    isCompleted: personalizedForm?.isCompleted || false,
                    totalItems,
                    completedItems
                };
            });

        // Calculate overall stats
        const totalFormsAvailable = zoomInForms.length + zoomOutForms.length;
        const completedForms = report.personalizedForms.filter(pf => pf.isCompleted).length;
        const completionRate = totalFormsAvailable > 0 
            ? Math.round((completedForms / totalFormsAvailable) * 100) 
            : 0;

        const reportData = {
            id: report.id,
            name: report.name,
            version: report.version,
            isCompleted: report.isCompleted,
            zoomInForms,
            zoomOutForms,
            stats: {
                totalForms: totalFormsAvailable,
                completedForms,
                completionRate
            }
        };

        return NextResponse.json({
            report: reportData,
            message: "Report menu data retrieved successfully"
        });

    } catch (error) {
        console.error("🚨 Error fetching report menu data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
