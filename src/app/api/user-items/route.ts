import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/user-items
 * Agrega un item a la sesión actual del usuario para un formulario específico
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

        const { itemId, formId, score } = await request.json();

        if (!itemId || !formId) {
            return NextResponse.json(
                { error: "Item ID and Form ID are required" },
                { status: 400 }
            );
        }

        // Validar el puntaje si se proporciona
        if (score !== undefined && score !== null && (typeof score !== 'number' || score < 1 || score > 5)) {
            return NextResponse.json(
                { error: "Score must be a number between 1 and 5, or null" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Verificar que el item y el formulario existen
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            include: {
                category: {
                    include: {
                        form: {
                            select: { id: true, name: true }
                        }
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

        if (item.category.form.id !== formId) {
            return NextResponse.json(
                { error: "Item does not belong to the specified form" },
                { status: 400 }
            );
        }

        // Obtener o crear la sesión actual del usuario para este formulario
        let userSession = await prisma.userFormSession.findFirst({
            where: {
                userId: userId,
                formId: formId,
                isCurrent: true
            }
        });

        if (!userSession) {
            // Crear nueva sesión
            userSession = await prisma.userFormSession.create({
                data: {
                    userId: userId,
                    formId: formId,
                    isCurrent: true,
                    sessionName: `Sesión ${new Date().toLocaleDateString()}`
                }
            });
        }

        // Agregar o actualizar el item en la sesión
        const userItemScore = await prisma.userItemScore.upsert({
            where: {
                userId_itemId_sessionId: {
                    userId: userId,
                    itemId: itemId,
                    sessionId: userSession.id
                }
            },
            update: {
                score: score || null,
                isSelected: true,
                updatedAt: new Date()
            },
            create: {
                userId: userId,
                itemId: itemId,
                sessionId: userSession.id,
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
            userItemScore,
            session: userSession,
            message: "Item added to session successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error adding item to user session:", error);
        
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
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
 * GET /api/user-items?formId=X&sessionId=Y
 * Obtiene los items del usuario para una sesión específica o la sesión actual de un formulario
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

        const { searchParams } = new URL(request.url);
        const formId = searchParams.get('formId');
        const sessionId = searchParams.get('sessionId');

        if (!formId && !sessionId) {
            return NextResponse.json(
                { error: "Either formId or sessionId is required" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        let targetSessionId: number;

        if (sessionId) {
            targetSessionId = parseInt(sessionId);
        } else if (formId) {
            // Buscar la sesión actual para este formulario
            const currentSession = await prisma.userFormSession.findFirst({
                where: {
                    userId: userId,
                    formId: parseInt(formId),
                    isCurrent: true
                }
            });

            if (!currentSession) {
                return NextResponse.json({
                    userItems: [],
                    session: null,
                    total: 0,
                    message: "No current session found for this form"
                });
            }

            targetSessionId = currentSession.id;
        } else {
            return NextResponse.json(
                { error: "Invalid parameters" },
                { status: 400 }
            );
        }

        // Obtener los items de la sesión
        const userItems = await prisma.userItemScore.findMany({
            where: {
                userId: userId,
                sessionId: targetSessionId,
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
                },
                session: {
                    select: {
                        id: true,
                        sessionName: true,
                        isCompleted: true,
                        createdAt: true,
                        updatedAt: true
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
        });

        // Agrupar por categoría
        interface CategoryGroup {
            category: {
                id: number;
                name: string;
            };
            items: Array<{
                id: number;
                name: string;
                score: number | null;
                userScoreId: number;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }

        const groupedByCategory: Record<string, CategoryGroup> = {};

        userItems.forEach((userItem) => {
            const categoryName = userItem.item.category.name;
            if (!groupedByCategory[categoryName]) {
                groupedByCategory[categoryName] = {
                    category: userItem.item.category,
                    items: []
                };
            }
            groupedByCategory[categoryName].items.push({
                id: userItem.item.id,
                name: userItem.item.name,
                score: userItem.score,
                userScoreId: userItem.id,
                createdAt: userItem.createdAt,
                updatedAt: userItem.updatedAt
            });
        });

        const result = Object.values(groupedByCategory);
        const sessionInfo = userItems[0]?.session || null;

        return NextResponse.json({
            userItems: result,
            session: sessionInfo,
            total: userItems.length,
            message: "User items retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching user items:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
