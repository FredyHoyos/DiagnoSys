import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organization/reports/[reportId]/view
 * Get complete report data for visualization with charts
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

        // Get report with all related data
        const report = await prisma.report.findFirst({
            where: {
                id: reportIdInt,
                userId: userId
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
                                        name: true,
                                        score: true,
                                        isCustom: true
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

        // Separate forms by zoom type
        const zoomInForms = report.personalizedForms.filter(form => 
            form.baseForm.tag?.toLowerCase().includes('zoom-in') || 
            form.baseForm.module.name.toLowerCase().includes('skills')
        );
        
        const zoomOutForms = report.personalizedForms.filter(form => 
            form.baseForm.tag?.toLowerCase().includes('zoom-out') || 
            form.baseForm.module.name.toLowerCase().includes('capabilities')
        );

        // Process data for charts
        const processFormsForCharts = (forms: typeof report.personalizedForms) => {
            return forms.map(form => {
                // Calculate average score per category
                const categoryData = form.personalizedCategories.map(category => {
                    const items = category.personalizedItems;
                    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
                    const avgScore = items.length > 0 ? totalScore / items.length : 0;
                    
                    return {
                        name: category.name,
                        score: Math.round(avgScore * 100) / 100, // Round to 2 decimals
                        maxScore: 5,
                        itemCount: items.length,
                        totalScore: totalScore
                    };
                });

                // Calculate overall form stats
                const totalItems = form.personalizedCategories.reduce(
                    (sum, cat) => sum + cat.personalizedItems.length, 0
                );
                const totalScore = form.personalizedCategories.reduce(
                    (sum, cat) => sum + cat.personalizedItems.reduce((catSum, item) => catSum + item.score, 0), 0
                );
                const avgScore = totalItems > 0 ? totalScore / totalItems : 0;

                return {
                    id: form.id,
                    name: form.name,
                    module: form.baseForm.module.name,
                    isCompleted: form.isCompleted,
                    completedAt: form.completedAt,
                    categoryData: categoryData,
                    stats: {
                        totalItems: totalItems,
                        totalScore: totalScore,
                        avgScore: Math.round(avgScore * 100) / 100,
                        maxPossibleScore: totalItems * 5,
                        completionPercentage: totalItems > 0 ? Math.round((avgScore / 5) * 100) : 0
                    }
                };
            });
        };

        const zoomInData = processFormsForCharts(zoomInForms);
        const zoomOutData = processFormsForCharts(zoomOutForms);

        // Calculate overall report stats
        const allForms = [...zoomInForms, ...zoomOutForms];
        const completedForms = allForms.filter(form => form.isCompleted).length;
        const totalForms = allForms.length;

        const overallStats = {
            totalForms: totalForms,
            completedForms: completedForms,
            completionRate: totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0,
            zoomInForms: zoomInData.length,
            zoomOutForms: zoomOutData.length,
            zoomInCompleted: zoomInData.filter(f => f.isCompleted).length,
            zoomOutCompleted: zoomOutData.filter(f => f.isCompleted).length
        };

        const responseData = {
            id: report.id,
            name: report.name,
            version: report.version,
            isCompleted: report.isCompleted,
            completedAt: report.completedAt,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            stats: overallStats,
            zoomInData: zoomInData,
            zoomOutData: zoomOutData
        };

        return NextResponse.json({
            reportData: responseData,
            message: "Report visualization data retrieved successfully"
        });

    } catch (error) {
        console.error("🚨 Error fetching report visualization data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
