import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { handlePrismaError, calculateAverageScore } from "@/lib/api-helpers";

/**
 * POST /api/admin/items
 * Crea un nuevo item en la plantilla base (solo admin)
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

        // Solo admin puede crear items en la plantilla base
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const { name, categoryId } = await request.json();

        if (!name || !categoryId) {
            return NextResponse.json(
                { error: "Item name and category ID are required" },
                { status: 400 }
            );
        }

        // Verificar que la categoría existe
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                form: {
                    include: {
                        module: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Crear el item
        const item = await prisma.item.create({
            data: {
                name: name.trim(),
                categoryId: categoryId
            },
            include: {
                category: {
                    include: {
                        form: {
                            include: {
                                module: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        userScores: true
                    }
                }
            }
        });

        return NextResponse.json({
            item,
            message: "Item created successfully in base template"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating admin item:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * GET /api/admin/items?categoryId=X&formId=Y
 * Obtiene todos los items de una categoría o formulario con estadísticas (solo admin)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo admin puede ver todas las estadísticas
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const formId = searchParams.get('formId');

        if (!categoryId && !formId) {
            return NextResponse.json(
                { error: "Either categoryId or formId is required" },
                { status: 400 }
            );
        }

        let whereCondition = {};

        if (categoryId) {
            whereCondition = { categoryId: parseInt(categoryId) };
        } else if (formId) {
            whereCondition = {
                category: {
                    formId: parseInt(formId)
                }
            };
        }

        const items = await prisma.item.findMany({
            where: whereCondition,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        form: {
                            select: {
                                id: true,
                                name: true,
                                module: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                userScores: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: {
                                    select: {
                                        name: true,
                                        displayName: true
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        userScores: true
                    }
                }
            },
            orderBy: [
                {
                    category: {
                        name: 'asc'
                    }
                },
                {
                    name: 'asc'
                }
            ]
        });

        // Agregar estadísticas a cada item
        const itemsWithStats = items.map(item => {
            const totalUsers = item.userScores.length;
            const scoredUsers = item.userScores.filter(score => score.score !== null).length;
            const scores = item.userScores
                .filter(score => score.score !== null)
                .map(score => score.score!)
                .filter((score): score is number => typeof score === 'number');
            
            const averageScore = calculateAverageScore(scores);

            const scoreDistribution = {
                1: scores.filter(s => s === 1).length,
                2: scores.filter(s => s === 2).length,
                3: scores.filter(s => s === 3).length,
                4: scores.filter(s => s === 4).length,
                5: scores.filter(s => s === 5).length
            };

            return {
                ...item,
                stats: {
                    totalUsers,
                    scoredUsers,
                    averageScore,
                    scoreDistribution,
                    adoptionRate: totalUsers > 0 ? Math.round((scoredUsers / totalUsers) * 100) : 0
                }
            };
        });

        return NextResponse.json({
            items: itemsWithStats,
            total: items.length,
            message: "Items retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching admin items:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}
