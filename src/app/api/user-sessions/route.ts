import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { isPrismaError, PRISMA_ERRORS } from "@/lib/prisma-errors";

/**
 * POST /api/user-sessions
 * Crea una nueva sesión de formulario para el usuario o obtiene la actual
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

        const { formId, sessionName } = await request.json();

        if (!formId) {
            return NextResponse.json(
                { error: "Form ID is required" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Verificar que el formulario existe
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                module: {
                    select: { name: true }
                }
            }
        });

        if (!form) {
            return NextResponse.json(
                { error: "Form not found" },
                { status: 404 }
            );
        }

        // Si se está creando una nueva sesión (con nombre), marcar la actual como no actual
        if (sessionName) {
            await prisma.userFormSession.updateMany({
                where: {
                    userId: userId,
                    formId: formId,
                    isCurrent: true
                },
                data: {
                    isCurrent: false
                }
            });
        }

        // Crear o obtener la sesión actual
        const userSession = await prisma.userFormSession.upsert({
            where: {
                userId_formId_isCurrent: {
                    userId: userId,
                    formId: formId,
                    isCurrent: true
                }
            },
            update: {
                sessionName: sessionName || null,
                updatedAt: new Date()
            },
            create: {
                userId: userId,
                formId: formId,
                sessionName: sessionName || null,
                isCurrent: true,
                isCompleted: false
            },
            include: {
                form: {
                    include: {
                        module: {
                            select: { name: true }
                        }
                    }
                },
                userItems: {
                    include: {
                        item: {
                            include: {
                                category: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Calcular estadísticas de la sesión
        const totalItems = userSession.userItems.length;
        const scoredItems = userSession.userItems.filter(item => item.score !== null).length;
        const completionPercentage = totalItems > 0 ? Math.round((scoredItems / totalItems) * 100) : 0;

        return NextResponse.json({
            session: {
                ...userSession,
                stats: {
                    totalItems,
                    scoredItems,
                    completionPercentage
                }
            },
            isNew: sessionName ? true : false,
            message: sessionName 
                ? "New session created successfully" 
                : "Current session retrieved successfully"
        }, { status: sessionName ? 201 : 200 });

    } catch (error) {
        console.error("Error managing user session:", error);
        
        if (isPrismaError(error, PRISMA_ERRORS.UNIQUE_CONSTRAINT)) {
            return NextResponse.json(
                { error: "Session already exists" },
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
 * GET /api/user-sessions?formId=X
 * Obtiene todas las sesiones del usuario para un formulario específico
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

        if (!formId) {
            return NextResponse.json(
                { error: "Form ID is required" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        const userSessions = await prisma.userFormSession.findMany({
            where: {
                userId: userId,
                formId: parseInt(formId)
            },
            include: {
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
                },
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
                    }
                },
                _count: {
                    select: {
                        userItems: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Agregar estadísticas a cada sesión
        const sessionsWithStats = userSessions.map(userSession => {
            const totalItems = userSession.userItems.length;
            const scoredItems = userSession.userItems.filter(item => item.score !== null).length;
            const completionPercentage = totalItems > 0 ? Math.round((scoredItems / totalItems) * 100) : 0;

            return {
                ...userSession,
                stats: {
                    totalItems,
                    scoredItems,
                    completionPercentage
                }
            };
        });

        return NextResponse.json({
            sessions: sessionsWithStats,
            total: userSessions.length,
            message: "User sessions retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching user sessions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
