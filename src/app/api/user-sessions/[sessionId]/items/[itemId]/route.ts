import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/user-sessions/[sessionId]/items/[itemId]
 * Remueve un item específico de la sesión del usuario
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ sessionId: string; itemId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { sessionId, itemId } = await context.params;
        const sessionIdInt = parseInt(sessionId);
        const itemIdInt = parseInt(itemId);
        
        if (isNaN(sessionIdInt) || isNaN(itemIdInt)) {
            return NextResponse.json(
                { error: "Invalid session ID or item ID" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Verificar que la sesión pertenece al usuario
        const userSession = await prisma.userFormSession.findFirst({
            where: {
                id: sessionIdInt,
                userId: userId
            }
        });

        if (!userSession) {
            return NextResponse.json(
                { error: "Session not found or access denied" },
                { status: 404 }
            );
        }

        // Remover el item de la sesión
        const deletedUserItem = await prisma.userItemScore.delete({
            where: {
                userId_itemId_sessionId: {
                    userId: userId,
                    itemId: itemIdInt,
                    sessionId: sessionIdInt
                }
            },
            include: {
                item: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            deletedItem: {
                id: deletedUserItem.item.id,
                name: deletedUserItem.item.name,
                category: deletedUserItem.item.category
            },
            message: "Item removed from session successfully"
        });

    } catch (error) {
        console.error("Error removing item from session:", error);
        
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return NextResponse.json(
                { error: "Item not found in this session" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user-sessions/[sessionId]/items/[itemId]
 * Actualiza el score de un item específico en la sesión
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ sessionId: string; itemId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { sessionId, itemId } = await context.params;
        const sessionIdInt = parseInt(sessionId);
        const itemIdInt = parseInt(itemId);
        
        if (isNaN(sessionIdInt) || isNaN(itemIdInt)) {
            return NextResponse.json(
                { error: "Invalid session ID or item ID" },
                { status: 400 }
            );
        }

        const { score, isSelected } = await request.json();

        if (score !== undefined && (typeof score !== 'number' || score < 1 || score > 10)) {
            return NextResponse.json(
                { error: "Score must be a number between 1 and 10" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Verificar que la sesión pertenece al usuario
        const userSession = await prisma.userFormSession.findFirst({
            where: {
                id: sessionIdInt,
                userId: userId
            }
        });

        if (!userSession) {
            return NextResponse.json(
                { error: "Session not found or access denied" },
                { status: 404 }
            );
        }

        // Verificar que el item existe en la sesión
        const existingUserItem = await prisma.userItemScore.findUnique({
            where: {
                userId_itemId_sessionId: {
                    userId: userId,
                    itemId: itemIdInt,
                    sessionId: sessionIdInt
                }
            }
        });

        if (!existingUserItem) {
            return NextResponse.json(
                { error: "Item not found in this session" },
                { status: 404 }
            );
        }

        // Actualizar el item
        const updatedUserItem = await prisma.userItemScore.update({
            where: {
                userId_itemId_sessionId: {
                    userId: userId,
                    itemId: itemIdInt,
                    sessionId: sessionIdInt
                }
            },
            data: {
                ...(score !== undefined && { score }),
                ...(isSelected !== undefined && { isSelected }),
                updatedAt: new Date()
            },
            include: {
                item: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            userItem: {
                id: updatedUserItem.item.id,
                name: updatedUserItem.item.name,
                category: updatedUserItem.item.category,
                score: updatedUserItem.score,
                userScoreId: updatedUserItem.id,
                isSelected: updatedUserItem.isSelected,
                updatedAt: updatedUserItem.updatedAt
            },
            message: "Item updated successfully"
        });

    } catch (error) {
        console.error("Error updating item in session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
