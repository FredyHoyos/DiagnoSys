import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

interface EvaluationData {
    formId: number;
    formName: string;
    isCompleted: boolean;
    scoredItems: number;
    totalScore: number;
    avgScore: number;
    completedAt: Date | null;
    updatedAt: Date;
}

interface ModuleStatsData {
    id: number;
    name: string;
    evaluations: EvaluationData[];
    totalScore: number;
    totalItems: number;
    completedCount: number;
    avgScore: number;
    completionRate: number;
}

interface CategoryAnalysisData {
    name: string;
    scores: number[];
    totalEvaluations: number;
}

/**
 * GET /api/organization/reports
 * Generar reporte de auto-evaluaciones completadas por la organización
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

        const organizationUserId = parseInt(session.user.id);
        
        // Obtener usuario y organización
        const user = await prisma.user.findUnique({
            where: { id: organizationUserId },
            include: {
                organization: true
            }
        });

        if (!user || !user.organization) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        // Obtener todas las auto-evaluaciones
        const personalizedForms = await prisma.personalizedForm.findMany({
            where: {
                userId: organizationUserId,
                auditId: null // Solo auto-evaluaciones
            },
            include: {
                baseForm: {
                    include: {
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
                        personalizedItems: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Estadísticas generales
        const totalEvaluations = personalizedForms.length;
        const completedEvaluations = personalizedForms.filter(f => f.isCompleted).length;
        const inProgressEvaluations = personalizedForms.filter(f => !f.isCompleted).length;

        // Estadísticas por módulo
        const moduleStats = personalizedForms.reduce((modules, form) => {
            const moduleId = form.baseForm.module.id;
            const moduleName = form.baseForm.module.name;
            
            if (!modules[moduleId]) {
                modules[moduleId] = {
                    id: moduleId,
                    name: moduleName,
                    evaluations: [],
                    totalScore: 0,
                    totalItems: 0,
                    completedCount: 0,
                    avgScore: 0,
                    completionRate: 0
                };
            }
            
            const scoredItems = form.personalizedCategories.reduce((sum, cat) => 
                sum + cat.personalizedItems.length, 0
            );
            const totalScore = form.personalizedCategories.reduce((sum, cat) => 
                sum + cat.personalizedItems.reduce((itemSum, item) => itemSum + (item.score || 0), 0), 0
            );

            modules[moduleId].evaluations.push({
                formId: form.id,
                formName: form.name,
                isCompleted: form.isCompleted,
                scoredItems: scoredItems,
                totalScore: totalScore,
                avgScore: scoredItems > 0 ? totalScore / scoredItems : 0,
                completedAt: form.completedAt,
                updatedAt: form.updatedAt
            });

            modules[moduleId].totalItems += scoredItems;
            modules[moduleId].totalScore += totalScore;
            if (form.isCompleted) modules[moduleId].completedCount++;
            
            return modules;
        }, {} as Record<number, ModuleStatsData>);

        // Calcular promedios por módulo
        Object.values(moduleStats).forEach((module: ModuleStatsData) => {
            module.avgScore = module.totalItems > 0 ? module.totalScore / module.totalItems : 0;
            module.completionRate = module.evaluations.length > 0 
                ? Math.round((module.completedCount / module.evaluations.length) * 100) 
                : 0;
        });

        // Análisis de rendimiento por categoría
        const categoryAnalysis = personalizedForms.reduce((categories, form) => {
            form.personalizedCategories.forEach(cat => {
                if (cat.personalizedItems.length > 0) {
                    const avgScore = cat.personalizedItems.reduce((sum, item) => sum + (item.score || 0), 0) / cat.personalizedItems.length;
                    
                    if (!categories[cat.name]) {
                        categories[cat.name] = {
                            name: cat.name,
                            scores: [],
                            totalEvaluations: 0
                        };
                    }
                    
                    categories[cat.name].scores.push(avgScore);
                    categories[cat.name].totalEvaluations++;
                }
            });
            return categories;
        }, {} as Record<string, CategoryAnalysisData>);

        // Calcular estadísticas por categoría y ordenar
        const categoryPerformance = Object.values(categoryAnalysis).map((cat: CategoryAnalysisData) => ({
            name: cat.name,
            avgScore: cat.scores.reduce((sum: number, score: number) => sum + score, 0) / cat.scores.length,
            evaluations: cat.totalEvaluations,
            minScore: Math.min(...cat.scores),
            maxScore: Math.max(...cat.scores)
        })).sort((a, b) => b.avgScore - a.avgScore);

        // Top 5 fortalezas y áreas de mejora
        const strengths = categoryPerformance.slice(0, 5);
        const improvementAreas = categoryPerformance.slice(-5).reverse();

        // Progreso temporal
        const timeline = personalizedForms
            .filter(form => form.completedAt)
            .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
            .map(form => ({
                formId: form.id,
                formName: form.name,
                moduleName: form.baseForm.module.name,
                completedAt: form.completedAt,
                avgScore: form.personalizedCategories.reduce((sum, cat) => {
                    const catItems = cat.personalizedItems;
                    if (catItems.length === 0) return sum;
                    return sum + (catItems.reduce((itemSum, item) => itemSum + (item.score || 0), 0) / catItems.length);
                }, 0) / (form.personalizedCategories.length || 1)
            }));

        // Puntuación general
        const allScores = personalizedForms.reduce((scores, form) => {
            form.personalizedCategories.forEach(cat => {
                cat.personalizedItems.forEach(item => {
                    if (item.score !== null) {
                        scores.push(item.score);
                    }
                });
            });
            return scores;
        }, [] as number[]);

        const overallAvg = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;

        // Distribución de puntajes
        const scoreDistribution = [1, 2, 3, 4, 5].map(score => ({
            score,
            count: allScores.filter(s => s === score).length,
            percentage: allScores.length > 0 ? Math.round((allScores.filter(s => s === score).length / allScores.length) * 100) : 0
        }));

        return NextResponse.json({
            organization: {
                id: user.organization.id,
                name: user.organization.name,
                description: user.organization.description
            },
            summary: {
                totalEvaluations,
                completedEvaluations,
                inProgressEvaluations,
                completionRate: totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0,
                overallAverage: Math.round(overallAvg * 100) / 100,
                totalResponses: allScores.length,
                maturityLevel: overallAvg >= 4 ? 'High' : overallAvg >= 3 ? 'Medium' : overallAvg >= 2 ? 'Low' : 'Critical'
            },
            moduleStats: Object.values(moduleStats),
            analysis: {
                scoreDistribution,
                categoryPerformance,
                strengths,
                improvementAreas
            },
            timeline,
            generatedAt: new Date().toISOString(),
            message: "Organization report generated successfully"
        });

    } catch (error) {
        console.error("Error generating organization report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
