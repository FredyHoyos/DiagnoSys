import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organization/forms/[baseFormId]
 * Obtener formulario personalizado para auto-evaluación (existente o crear nuevo)
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ baseFormId: string }> }
) {
    const { baseFormId } = await context.params;
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

        const baseFormIdInt = parseInt(baseFormId);
        const organizationUserId = parseInt(session.user.id);
        
        if (isNaN(baseFormIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        // Verificar que el formulario base existe y está publicado
        const baseForm = await prisma.form.findFirst({
            where: {
                id: baseFormIdInt,
                isPublished: true
            },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                categories: {
                    include: {
                        items: true
                    },
                    orderBy: { name: 'asc' }
                }
            }
        });

        if (!baseForm) {
            return NextResponse.json(
                { error: "Form not found or not published" },
                { status: 404 }
            );
        }

        // Buscar formulario personalizado existente
        let personalizedForm = await prisma.personalizedForm.findFirst({
            where: {
                userId: organizationUserId,
                baseFormId: baseFormIdInt,
                auditId: null // Auto-evaluaciones no tienen auditoría
            },
            include: {
                personalizedCategories: {
                    include: {
                        personalizedItems: true
                    },
                    orderBy: { name: 'asc' }
                }
            }
        });

        // Si no existe, crear formulario personalizado
        if (!personalizedForm) {
            personalizedForm = await prisma.$transaction(async (tx) => {
                // Crear formulario personalizado
                const newPersonalizedForm = await tx.personalizedForm.create({
                    data: {
                        name: baseForm.name,
                        description: baseForm.description,
                        baseFormId: baseFormIdInt,
                        userId: organizationUserId,
                        auditId: null // Sin auditoría para auto-evaluaciones
                    }
                });

                // Crear categorías personalizadas
                for (const baseCategory of baseForm.categories) {
                    const personalizedCategory = await tx.personalizedCategory.create({
                        data: {
                            name: baseCategory.name,
                            baseCategoryId: baseCategory.id,
                            personalizedFormId: newPersonalizedForm.id
                        }
                    });

                    // Crear items personalizados (todos los items del formulario base)
                    for (const baseItem of baseCategory.items) {
                        await tx.personalizedItem.create({
                            data: {
                                name: baseItem.name,
                                isCustom: false,
                                baseItemId: baseItem.id,
                                personalizedCategoryId: personalizedCategory.id,
                                score: null // Sin puntaje inicial
                            }
                        });
                    }
                }

                // Obtener formulario completo creado
                return await tx.personalizedForm.findUnique({
                    where: { id: newPersonalizedForm.id },
                    include: {
                        personalizedCategories: {
                            include: {
                                personalizedItems: true
                            },
                            orderBy: { name: 'asc' }
                        }
                    }
                });
            });
        }

        // Procesar datos para respuesta
        const formData = {
            id: personalizedForm!.id,
            name: personalizedForm!.name,
            description: personalizedForm!.description,
            baseForm: {
                id: baseForm.id,
                name: baseForm.name,
                module: baseForm.module
            },
            isCompleted: personalizedForm!.isCompleted,
            progress: personalizedForm!.progress,
            globalComments: personalizedForm!.globalComments,
            completedAt: personalizedForm!.completedAt,
            categories: personalizedForm!.personalizedCategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                items: cat.personalizedItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    isCustom: item.isCustom,
                    score: item.score,
                    notes: item.notes,
                    comment: item.comment
                }))
            })),
            createdAt: personalizedForm!.createdAt,
            updatedAt: personalizedForm!.updatedAt
        };

        // Estadísticas
        const totalItems = personalizedForm!.personalizedCategories.reduce(
            (sum, cat) => sum + cat.personalizedItems.length, 0
        );
        const scoredItems = personalizedForm!.personalizedCategories.reduce(
            (sum, cat) => sum + cat.personalizedItems.filter(item => item.score !== null).length, 0
        );

        return NextResponse.json({
            form: formData,
            stats: {
                totalItems,
                scoredItems,
                progress: totalItems > 0 ? Math.round((scoredItems / totalItems) * 100) : 0,
                avgScore: scoredItems > 0 
                    ? personalizedForm!.personalizedCategories.reduce((sum, cat) => 
                        sum + cat.personalizedItems
                            .filter(item => item.score !== null)
                            .reduce((itemSum, item) => itemSum + (item.score || 0), 0), 0
                      ) / scoredItems
                    : 0
            },
            message: personalizedForm ? "Existing evaluation retrieved" : "New evaluation created"
        });

    } catch (error) {
        console.error("Error fetching/creating personalized form:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/organization/forms/[baseFormId]
 * Guardar evaluación de auto-evaluación
 */
export async function POST(
    request: Request,
    context: { params: Promise<{ baseFormId: string }> }
) {
    const { baseFormId } = await context.params;
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

        const body = await request.json();
        const { categories, globalComments, isCompleted } = body;
        
        const baseFormIdInt = parseInt(baseFormId);
        const organizationUserId = parseInt(session.user.id);
        
        if (isNaN(baseFormIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        if (!categories || !Array.isArray(categories)) {
            return NextResponse.json(
                { error: "Categories data is required" },
                { status: 400 }
            );
        }

        // Buscar formulario personalizado
        const personalizedForm = await prisma.personalizedForm.findFirst({
            where: {
                userId: organizationUserId,
                baseFormId: baseFormIdInt,
                auditId: null
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
                { error: "Personalized form not found" },
                { status: 404 }
            );
        }

        // Guardar evaluación en transacción
        const result = await prisma.$transaction(async (tx) => {
            let totalScoredItems = 0;
            let totalScore = 0;

            // Actualizar puntajes por categoría
            for (const categoryData of categories) {
                if (categoryData.items && Array.isArray(categoryData.items)) {
                    for (const itemData of categoryData.items) {
                        if (itemData.score !== null && itemData.score >= 1 && itemData.score <= 5) {
                            await tx.personalizedItem.update({
                                where: { id: itemData.itemId },
                                data: {
                                    score: itemData.score,
                                    notes: itemData.notes || null,
                                    comment: itemData.comment || null
                                }
                            });
                            totalScoredItems++;
                            totalScore += itemData.score;
                        }
                    }
                }
            }

            // Calcular progreso
            const totalItems = personalizedForm.personalizedCategories.reduce(
                (sum, cat) => sum + cat.personalizedItems.length, 0
            );
            const progress = totalItems > 0 ? Math.round((totalScoredItems / totalItems) * 100) : 0;

            // Actualizar formulario personalizado
            const updatedForm = await tx.personalizedForm.update({
                where: { id: personalizedForm.id },
                data: {
                    globalComments: globalComments || null,
                    isCompleted: isCompleted === true,
                    progress: progress,
                    completedAt: isCompleted === true ? new Date() : null,
                    updatedAt: new Date()
                }
            });

            return {
                updatedForm,
                stats: {
                    totalItems,
                    totalScoredItems,
                    averageScore: totalScoredItems > 0 ? totalScore / totalScoredItems : 0,
                    progress
                }
            };
        });

        return NextResponse.json({
            form: {
                id: result.updatedForm.id,
                isCompleted: result.updatedForm.isCompleted,
                progress: result.updatedForm.progress,
                globalComments: result.updatedForm.globalComments,
                completedAt: result.updatedForm.completedAt,
                updatedAt: result.updatedForm.updatedAt
            },
            stats: result.stats,
            message: isCompleted 
                ? "Self-evaluation completed successfully" 
                : "Self-evaluation saved successfully"
        });

    } catch (error) {
        console.error("Error saving self-evaluation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
