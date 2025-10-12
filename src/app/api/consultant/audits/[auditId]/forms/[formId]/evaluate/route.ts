import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

interface ItemScore {
    itemId: number;
    score: number;
    comment?: string;
}

interface CategoryScores {
    categoryId: number;
    items: ItemScore[];
}

interface EvaluationData {
    categories: CategoryScores[];
    globalComments?: string;
    isCompleted?: boolean;
}

/**
 * PUT /api/consultant/audits/[auditId]/forms/[formId]/evaluate
 * Evaluar/calificar un formulario personalizado completo con sus ítems
 */
export async function PUT(
    request: Request,
    context: { params: Promise<{ auditId: string; formId: string }> }
) {
    const { auditId, formId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        if (session.user.role?.name !== 'consultant') {
            return NextResponse.json(
                { error: "Consultant access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { categories, globalComments, isCompleted }: EvaluationData = body;
        
        const auditIdInt = parseInt(auditId);
        const formIdInt = parseInt(formId);
        const consultantId = parseInt(session.user.id);
        
        if (isNaN(auditIdInt) || isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid audit or form ID" },
                { status: 400 }
            );
        }

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return NextResponse.json(
                { error: "Categories with scores are required" },
                { status: 400 }
            );
        }

        // Validación de scores (1-5)
        const hasInvalidScores = categories.some(cat => 
            cat.items.some(item => 
                typeof item.score !== 'number' || 
                item.score < 1 || 
                item.score > 5
            )
        );

        if (hasInvalidScores) {
            return NextResponse.json(
                { error: "All scores must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Verificar que el formulario existe y pertenece al consultor en esta auditoría
        const personalizedForm = await prisma.personalizedForm.findFirst({
            where: {
                id: formIdInt,
                auditId: auditIdInt,
                userId: consultantId
            },
            include: {
                personalizedCategories: {
                    include: {
                        personalizedItems: true
                    }
                }
            }
        });

        if (!personalizedForm) {
            return NextResponse.json(
                { error: "Personalized form not found or access denied" },
                { status: 404 }
            );
        }

        // Procesar evaluación en transacción
        const result = await prisma.$transaction(async (tx) => {
            // Actualizar scores de los items
            for (const category of categories) {
                for (const itemScore of category.items) {
                    await tx.personalizedItem.update({
                        where: {
                            id: itemScore.itemId,
                            personalizedCategoryId: category.categoryId
                        },
                        data: {
                            score: itemScore.score,
                            comment: itemScore.comment || null
                        }
                    });
                }
            }

            // Calcular estadísticas del formulario
            const totalItems = personalizedForm.personalizedCategories.reduce(
                (sum, cat) => sum + cat.personalizedItems.length, 0
            );
            
            const scoredItems = categories.reduce(
                (sum, cat) => sum + cat.items.length, 0
            );

            const totalScore = categories.reduce((sum, cat) => 
                sum + cat.items.reduce((itemSum, item) => itemSum + item.score, 0), 0
            );

            const averageScore = scoredItems > 0 ? totalScore / scoredItems : 0;
            const progress = totalItems > 0 ? Math.round((scoredItems / totalItems) * 100) : 0;

            // Actualizar formulario personalizado
            const updatedForm = await tx.personalizedForm.update({
                where: { id: formIdInt },
                data: {
                    globalComments: globalComments || null,
                    isCompleted: isCompleted === true,
                    progress: progress,
                    completedAt: isCompleted === true ? new Date() : null,
                    updatedAt: new Date()
                }
            });

            return { updatedForm, stats: { totalItems, scoredItems, averageScore, progress } };
        });

        // Obtener formulario actualizado con datos completos
        const finalForm = await prisma.personalizedForm.findUnique({
            where: { id: formIdInt },
            include: {
                baseForm: {
                    select: {
                        id: true,
                        name: true,
                        module: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                personalizedCategories: {
                    include: {
                        personalizedItems: {
                            where: {
                                score: {
                                    not: null
                                }
                            }
                        }
                    },
                    where: {
                        personalizedItems: {
                            some: {
                                score: {
                                    not: null
                                }
                            }
                        }
                    }
                }
            }
        });

        // Calcular estadísticas por categoría
        const categoryStats = finalForm?.personalizedCategories.map(cat => ({
            categoryId: cat.id,
            name: cat.name,
            itemsCount: cat.personalizedItems.length,
            averageScore: cat.personalizedItems.length > 0
                ? cat.personalizedItems.reduce((sum, item) => sum + (item.score || 0), 0) / cat.personalizedItems.length
                : 0,
            minScore: cat.personalizedItems.length > 0
                ? Math.min(...cat.personalizedItems.map(item => item.score || 0))
                : 0,
            maxScore: cat.personalizedItems.length > 0
                ? Math.max(...cat.personalizedItems.map(item => item.score || 0))
                : 0
        })) || [];

        return NextResponse.json({
            form: {
                id: finalForm?.id,
                name: finalForm?.name,
                baseForm: finalForm?.baseForm,
                isCompleted: finalForm?.isCompleted,
                progress: finalForm?.progress,
                globalComments: finalForm?.globalComments,
                completedAt: finalForm?.completedAt,
                updatedAt: finalForm?.updatedAt
            },
            evaluation: {
                totalItems: result.stats.totalItems,
                scoredItems: result.stats.scoredItems,
                averageScore: Math.round(result.stats.averageScore * 100) / 100,
                progress: result.stats.progress
            },
            categoryStats: categoryStats,
            message: isCompleted 
                ? "Form evaluation completed successfully" 
                : "Form evaluation saved successfully"
        });

    } catch (error) {
        console.error("Error evaluating form:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
