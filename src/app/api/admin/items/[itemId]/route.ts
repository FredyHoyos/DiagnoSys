import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { handlePrismaError, calculateAverageScore } from "@/lib/api-helpers";

/**
 * PUT /api/admin/items/[itemId]
 * Actualiza un item de la plantilla base (solo admin)
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ itemId: string }> }
) {
    const { itemId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo admin puede actualizar items de la plantilla base
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const itemIdInt = parseInt(itemId);
        
        if (isNaN(itemIdInt)) {
            return NextResponse.json(
                { error: "Invalid item ID" },
                { status: 400 }
            );
        }

        const { name } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Item name is required" },
                { status: 400 }
            );
        }

        const item = await prisma.item.update({
            where: { id: itemIdInt },
            data: {
                name: name.trim()
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
            }
        });

        return NextResponse.json({
            item,
            message: "Item updated successfully"
        });

    } catch (error) {
        console.error("Error updating admin item:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * DELETE /api/admin/items/[itemId]
 * Elimina un item de la plantilla base (solo admin)
 * ADVERTENCIA: Esto eliminará todos los puntajes de usuarios asociados
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ itemId: string }> }
) {
    const { itemId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo admin puede eliminar items de la plantilla base
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const itemIdInt = parseInt(itemId);
        
        if (isNaN(itemIdInt)) {
            return NextResponse.json(
                { error: "Invalid item ID" },
                { status: 400 }
            );
        }

        // Obtener información del item antes de eliminarlo
        const item = await prisma.item.findUnique({
            where: { id: itemIdInt },
            include: {
                _count: {
                    select: {
                        userScores: true
                    }
                }
            }
        });

        if (!item) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            );
        }

        // Eliminar el item (los userScores se eliminan en cascada)
        await prisma.item.delete({
            where: { id: itemIdInt }
        });

        return NextResponse.json({
            message: `Item deleted successfully. ${item._count.userScores} user scores were also removed.`,
            deletedUserScores: item._count.userScores
        });

    } catch (error) {
        console.error("Error deleting admin item:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * GET /api/admin/items/[itemId]
 * Obtiene un item específico con todas sus estadísticas (solo admin)
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ itemId: string }> }
) {
    const { itemId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo admin puede ver estadísticas detalladas
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const itemIdInt = parseInt(itemId);
        
        if (isNaN(itemIdInt)) {
            return NextResponse.json(
                { error: "Invalid item ID" },
                { status: 400 }
            );
        }

        const item = await prisma.item.findUnique({
            where: { id: itemIdInt },
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
                    },
                    orderBy: {
                        updatedAt: 'desc'
                    }
                }
            }
        });

        if (!item) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            );
        }

        // Calcular estadísticas detalladas
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

        const roleDistribution = item.userScores.reduce((acc, score) => {
            const roleName = score.user.role.name;
            if (!acc[roleName]) {
                acc[roleName] = { total: 0, scored: 0 };
            }
            acc[roleName].total++;
            if (score.score !== null) {
                acc[roleName].scored++;
            }
            return acc;
        }, {} as Record<string, { total: number; scored: number }>);

        const itemWithStats = {
            ...item,
            stats: {
                totalUsers,
                scoredUsers,
                averageScore,
                scoreDistribution,
                roleDistribution,
                adoptionRate: totalUsers > 0 ? Math.round((scoredUsers / totalUsers) * 100) : 0,
                lastActivity: item.userScores[0]?.updatedAt || null
            }
        };

        return NextResponse.json({
            item: itemWithStats,
            message: "Item details retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching admin item details:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
