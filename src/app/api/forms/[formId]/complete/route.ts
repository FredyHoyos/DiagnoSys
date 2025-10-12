import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/forms/[formId]/complete
 * Marca un formulario como completado por el usuario
 */
export async function POST(
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

        // Verificar que el formulario existe
        const form = await prisma.form.findUnique({
            where: { id: formIdInt },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true
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

        // Marcar la sesión actual como completada
        const currentSession = await prisma.userFormSession.findFirst({
            where: {
                userId: userId,
                formId: formIdInt,
                isCurrent: true
            }
        });

        if (!currentSession) {
            return NextResponse.json(
                { error: "No current session found for this form" },
                { status: 404 }
            );
        }

        const userFormSession = await prisma.userFormSession.update({
            where: {
                id: currentSession.id
            },
            data: {
                isCompleted: true,
                completedAt: new Date()
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
                }
            }
        });

        // Obtener estadísticas del formulario para el usuario
        const userItemsCount = await prisma.userItemScore.count({
            where: {
                userId: userId,
                sessionId: userFormSession.id
            }
        });

        const userScoredItemsCount = await prisma.userItemScore.count({
            where: {
                userId: userId,
                sessionId: userFormSession.id,
                score: {
                    not: null
                }
            }
        });

        return NextResponse.json({
            session: userFormSession,
            stats: {
                totalUserItems: userItemsCount,
                scoredItems: userScoredItemsCount,
                completionPercentage: userItemsCount > 0 
                    ? Math.round((userScoredItemsCount / userItemsCount) * 100) 
                    : 0
            },
            message: "Form session marked as completed successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error completing form:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/forms/[formId]/complete
 * Desmarca un formulario como completado
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

        const formIdInt = parseInt(formId);
        
        if (isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        // Marcar la sesión actual como no completada
        const currentSession = await prisma.userFormSession.findFirst({
            where: {
                userId: userId,
                formId: formIdInt,
                isCurrent: true
            }
        });

        if (!currentSession) {
            return NextResponse.json(
                { error: "No current session found for this form" },
                { status: 404 }
            );
        }

        await prisma.userFormSession.update({
            where: {
                id: currentSession.id
            },
            data: {
                isCompleted: false,
                completedAt: null
            }
        });

        return NextResponse.json({
            message: "Form session unmarked as completed successfully"
        });

    } catch (error) {
        console.error("Error uncompleting form:", error);
        
        function hasCodeProperty(err: unknown): err is { code: string } {
            return typeof err === "object" && err !== null && "code" in err && typeof (err as { code: unknown }).code === "string";
        }

        if (hasCodeProperty(error) && error.code === 'P2025') {
            return NextResponse.json(
                { error: "Form session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
