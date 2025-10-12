import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/user-sessions/[sessionId]/complete
 * Marca una sesión como completada
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ sessionId: string }> }
) {
    const { sessionId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const sessionIdInt = parseInt(sessionId);
        
        if (isNaN(sessionIdInt)) {
            return NextResponse.json(
                { error: "Invalid session ID" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Verificar que la sesión pertenece al usuario
        const userSession = await prisma.userFormSession.findFirst({
            where: {
                id: sessionIdInt,
                userId: userId
            },
            include: {
                userItems: true
            }
        });

        if (!userSession) {
            return NextResponse.json(
                { error: "Session not found or access denied" },
                { status: 404 }
            );
        }

        if (userSession.isCompleted) {
            return NextResponse.json(
                { error: "Session is already completed" },
                { status: 400 }
            );
        }

        // Verificar que la sesión tiene items
        if (userSession.userItems.length === 0) {
            return NextResponse.json(
                { error: "Cannot complete session without items" },
                { status: 400 }
            );
        }

        // Verificar que todos los items seleccionados tienen score
        const itemsWithoutScore = userSession.userItems.filter(
            item => item.isSelected && !item.score
        );

        if (itemsWithoutScore.length > 0) {
            return NextResponse.json(
                { 
                    error: "All selected items must have a score before completing",
                    itemsWithoutScore: itemsWithoutScore.length
                },
                { status: 400 }
            );
        }

        // Marcar sesión como completada y no actual
        const updatedSession = await prisma.userFormSession.update({
            where: { id: sessionIdInt },
            data: {
                isCompleted: true,
                isCurrent: false,
                completedAt: new Date()
            },
            include: {
                form: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                userItems: {
                    where: {
                        isSelected: true
                    },
                    include: {
                        item: {
                            include: {
                                category: true
                            }
                        }
                    }
                }
            }
        });

        // Calcular estadísticas de la sesión completada
        const selectedItems = updatedSession.userItems;
        const totalScore = selectedItems.reduce((sum: number, item) => sum + (item.score || 0), 0);
        const averageScore = selectedItems.length > 0 ? totalScore / selectedItems.length : 0;
        const scoreDistribution = selectedItems.reduce((dist: Record<number, number>, item) => {
            const score = item.score || 0;
            dist[score] = (dist[score] || 0) + 1;
            return dist;
        }, {} as Record<number, number>);

        return NextResponse.json({
            session: {
                id: updatedSession.id,
                sessionName: updatedSession.sessionName,
                isCompleted: updatedSession.isCompleted,
                completedAt: updatedSession.completedAt,
                form: updatedSession.form
            },
            statistics: {
                totalItems: selectedItems.length,
                totalScore,
                averageScore: Math.round(averageScore * 100) / 100,
                scoreDistribution
            },
            message: "Session completed successfully"
        });

    } catch (error) {
        console.error("Error completing session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
