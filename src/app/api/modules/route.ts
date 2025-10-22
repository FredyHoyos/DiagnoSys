import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { isPrismaError, PRISMA_ERRORS } from "@/lib/prisma-errors";

/**
 * GET /api/modules
 * Obtiene todos los módulos disponibles
 * Accesible para todos los usuarios autenticados
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const modules = await prisma.module.findMany({
            include: {
                forms: {
                    include: {
                        _count: {
                            select: {
                                categories: true,
                                personalizedForms: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        forms: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json({
            modules,
            message: "Modules retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching modules:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/modules
 * Crea un nuevo módulo (solo admin)
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

        // Solo admin puede crear módulos
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Module name is required" },
                { status: 400 }
            );
        }

        const newModule = await prisma.module.create({
            data: {
                name,
                description: description || null
            },
            include: {
                forms: true,
                _count: {
                    select: {
                        forms: true
                    }
                }
            }
        });

        return NextResponse.json({
            module: newModule,
            message: "Module created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating module:", error);
        
        if (isPrismaError(error, PRISMA_ERRORS.UNIQUE_CONSTRAINT)) {
            return NextResponse.json(
                { error: "Module name already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
