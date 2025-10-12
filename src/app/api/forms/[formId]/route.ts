import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/api-helpers";

/**
 * GET /api/forms/[formId]
 * Obtiene un formulario específico con todas sus categorías e items
 * Incluye los puntajes del usuario si existen
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ formId: string }> }
) {
    const { formId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const formIdInt = parseInt(formId);
        
        if (isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);
        const isAdmin = session.user.role?.name === 'admin';

        // Obtener el formulario completo
        const form = await prisma.form.findUnique({
            where: { id: formIdInt },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                categories: {
                    include: {
                        items: {
                            include: {
                                userScores: {
                                    where: { userId },
                                    select: {
                                        id: true,
                                        score: true,
                                        createdAt: true,
                                        updatedAt: true
                                    }
                                },
                                // Solo admin puede ver todos los puntajes
                                ...(isAdmin && {
                                    _count: {
                                        select: {
                                            userScores: true
                                        }
                                    }
                                })
                            },
                            orderBy: {
                                createdAt: 'asc'
                            }
                        },
                        _count: {
                            select: {
                                items: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                userSessions: {
                    where: { 
                        userId,
                        isCompleted: true 
                    },
                    select: {
                        id: true,
                        createdAt: true,
                        updatedAt: true,
                        completedAt: true
                    }
                },
                _count: {
                    select: {
                        categories: true,
                        userSessions: true
                    }
                }
            }
        });

        if (!form) {
            return NextResponse.json(
                { error: "Form not found" },
                { status: 404 }
            );
        }

        // Procesar los datos para incluir estadísticas
        const formWithIncludes = form as typeof form & {
            categories: Array<{
                items: Array<{
                    userScores: Array<{ score: number | null }>
                }>
            }>,
            userSessions: Array<{ completedAt: Date | null }>
        };
        
        const totalItems = formWithIncludes.categories.reduce((sum: number, cat) => sum + cat.items.length, 0);
        const userScoredItems = formWithIncludes.categories.reduce((sum: number, cat) => 
            sum + cat.items.filter(item => 
                item.userScores.some(score => score.score !== null)
            ).length, 0
        );

        const isCompleted = formWithIncludes.userSessions.length > 0;
        const completionPercentage = totalItems > 0 ? Math.round((userScoredItems / totalItems) * 100) : 0;

        // Procesar categorías para incluir estadísticas por categoría
        const processedCategories = formWithIncludes.categories.map(category => {
            const categoryUserScoredItems = category.items.filter(item => 
                item.userScores.some(score => score.score !== null)
            ).length;
            
            const categoryCompletionPercentage = category.items.length > 0 
                ? Math.round((categoryUserScoredItems / category.items.length) * 100) 
                : 0;

            return {
                ...category,
                stats: {
                    totalItems: category.items.length,
                    userScoredItems: categoryUserScoredItems,
                    completionPercentage: categoryCompletionPercentage
                }
            };
        });

        const result = {
            ...form,
            categories: processedCategories,
            stats: {
                totalItems,
                userScoredItems,
                completionPercentage,
                isCompleted,
                lastActivity: formWithIncludes.userSessions[0]?.completedAt || null,
                totalCategories: formWithIncludes.categories.length
            }
        };

        return NextResponse.json({
            form: result,
            message: "Form retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching form:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/forms/[formId]
 * Actualiza un formulario (solo admin)
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ formId: string }> }
) {
    const { formId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo admin puede actualizar formularios
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const formIdInt = parseInt(formId);
        
        if (isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Form name is required" },
                { status: 400 }
            );
        }

        const form = await prisma.form.update({
            where: { id: formIdInt },
            data: {
                name,
                description: description || null
            },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                categories: {
                    include: {
                        items: true,
                        _count: {
                            select: {
                                items: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        categories: true,
                        userSessions: true
                    }
                }
            }
        });

        return NextResponse.json({
            form,
            message: "Form updated successfully"
        });

    } catch (error) {
        console.error("Error updating form:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * DELETE /api/forms/[formId]
 * Elimina un formulario (solo admin)
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ formId: string }> }
) {
    const { formId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo admin puede eliminar formularios
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const formIdInt = parseInt(formId);
        
        if (isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        await prisma.form.delete({
            where: { id: formIdInt }
        });

        return NextResponse.json({
            message: "Form deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting form:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}
