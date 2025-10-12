import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/api-helpers";

/**
 * PUT /api/user-items/[userScoreId]/score
 * Actualiza el puntaje de un item específico del usuario
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ userScoreId: string }> }
) {
    const { userScoreId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const userScoreIdInt = parseInt(userScoreId);
        
        if (isNaN(userScoreIdInt)) {
            return NextResponse.json(
                { error: "Invalid user score ID" },
                { status: 400 }
            );
        }

        const { score } = await request.json();

        // Validar el puntaje
        if (score !== null && (typeof score !== 'number' || score < 1 || score > 5)) {
            return NextResponse.json(
                { error: "Score must be a number between 1 and 5, or null" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Verificar que el puntaje pertenece al usuario actual
        const existingScore = await prisma.userItemScore.findFirst({
            where: {
                id: userScoreIdInt,
                userId: userId
            },
            include: {
                item: {
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
                        }
                    }
                }
            }
        });

        if (!existingScore) {
            return NextResponse.json(
                { error: "User score not found or access denied" },
                { status: 404 }
            );
        }

        // Actualizar el puntaje
        const updatedScore = await prisma.userItemScore.update({
            where: { id: userScoreIdInt },
            data: { score },
            include: {
                item: {
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
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            userScore: updatedScore,
            message: score !== null 
                ? `Score updated to ${score}` 
                : "Score removed successfully"
        });

    } catch (error) {
        console.error("Error updating user score:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * DELETE /api/user-items/[userScoreId]/score
 * Elimina un item de la lista del usuario
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ userScoreId: string }> }
) {
    const { userScoreId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const userScoreIdInt = parseInt(userScoreId);
        
        if (isNaN(userScoreIdInt)) {
            return NextResponse.json(
                { error: "Invalid user score ID" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Verificar que el puntaje pertenece al usuario actual
        const existingScore = await prisma.userItemScore.findFirst({
            where: {
                id: userScoreIdInt,
                userId: userId
            }
        });

        if (!existingScore) {
            return NextResponse.json(
                { error: "User score not found or access denied" },
                { status: 404 }
            );
        }

        // Eliminar el puntaje del usuario
        await prisma.userItemScore.delete({
            where: { id: userScoreIdInt }
        });

        return NextResponse.json({
            message: "Item removed from your list successfully"
        });

    } catch (error) {
        console.error("Error deleting user score:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}
