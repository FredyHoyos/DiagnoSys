import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { isPrismaError, PRISMA_ERRORS } from "@/lib/prisma-errors";

/**
 * POST /api/user-sessions/[sessionId]/items
 * Agrega un item a la sesión específica del usuario
 */
export async function POST(
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

        const { itemId, itemName, categoryId, score } = await request.json();

        if (!itemId && (!itemName || !categoryId)) {
            return NextResponse.json(
                { error: "Either itemId or (itemName and categoryId) are required" },
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

        let item;

        if (itemId) {
            // Usar item existente
            item = await prisma.item.findUnique({
                where: { id: itemId },
                include: {
                    category: true
                }
            });

            if (!item) {
                return NextResponse.json(
                    { error: "Item not found" },
                    { status: 404 }
                );
            }
        } else {
            // Crear o buscar item por nombre
            item = await prisma.item.findFirst({
                where: {
                    name: itemName.trim(),
                    categoryId: categoryId
                },
                include: {
                    category: true
                }
            });

            if (!item) {
                // Crear nuevo item
                item = await prisma.item.create({
                    data: {
                        name: itemName.trim(),
                        categoryId: categoryId
                    },
                    include: {
                        category: true
                    }
                });
            }
        }

        // Agregar item a la sesión del usuario
        const userItemScore = await prisma.userItemScore.upsert({
            where: {
                userId_itemId_sessionId: {
                    userId: userId,
                    itemId: item.id,
                    sessionId: sessionIdInt
                }
            },
            update: {
                score: score || null,
                isSelected: true,
                updatedAt: new Date()
            },
            create: {
                userId: userId,
                itemId: item.id,
                sessionId: sessionIdInt,
                score: score || null,
                isSelected: true
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
            userItem: userItemScore,
            message: "Item added to session successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error adding item to session:", error);
        
        if (isPrismaError(error, PRISMA_ERRORS.UNIQUE_CONSTRAINT)) {
            return NextResponse.json(
                { error: "Item already exists in this session" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/user-sessions/[sessionId]/items
 * Obtiene todos los items de la sesión específica
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { sessionId } = await context.params;
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
                userItems: {
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
                    },
                    orderBy: [
                        {
                            item: {
                                category: {
                                    name: 'asc'
                                }
                            }
                        },
                        {
                            item: {
                                name: 'asc'
                            }
                        }
                    ]
                }
            }
        });

        if (!userSession) {
            return NextResponse.json(
                { error: "Session not found or access denied" },
                { status: 404 }
            );
        }

        // Agrupar items por categoría
        const itemsByCategory: Record<string, {
            category: { id: number; name: string };
            items: Array<{
                id: number;
                name: string;
                score: number | null;
                userScoreId: number;
                isSelected: boolean;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }> = {};
        
        userSession.userItems.forEach(userItem => {
            const categoryName = userItem.item.category.name;
            
            if (!itemsByCategory[categoryName]) {
                itemsByCategory[categoryName] = {
                    category: userItem.item.category,
                    items: []
                };
            }
            
            itemsByCategory[categoryName].items.push({
                id: userItem.item.id,
                name: userItem.item.name,
                score: userItem.score,
                userScoreId: userItem.id,
                isSelected: userItem.isSelected,
                createdAt: userItem.createdAt,
                updatedAt: userItem.updatedAt
            });
        });

        const result = Object.values(itemsByCategory);

        return NextResponse.json({
            session: {
                id: userSession.id,
                sessionName: userSession.sessionName,
                isCompleted: userSession.isCompleted,
                isCurrent: userSession.isCurrent
            },
            categories: result,
            totalItems: userSession.userItems.length,
            message: "Session items retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching session items:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
