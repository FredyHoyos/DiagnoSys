import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/api-helpers";

/**
 * GET /api/modules/[moduleId]/forms
 * Obtiene todos los formularios de un módulo específico
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ moduleId: string }> }
) {
    const { moduleId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const moduleIdInt = parseInt(moduleId);
        
        if (isNaN(moduleIdInt)) {
            return NextResponse.json(
                { error: "Invalid module ID" },
                { status: 400 }
            );
        }

        // Verificar que el módulo existe
        const moduleData = await prisma.module.findUnique({
            where: { id: moduleIdInt },
            select: { id: true, name: true, description: true }
        });

        if (!moduleData) {
            return NextResponse.json(
                { error: "Module not found" },
                { status: 404 }
            );
        }

        // Obtener formularios básicos sin información de usuario específica
        const forms = await prisma.form.findMany({
            where: { moduleId: moduleIdInt },
            select: {
                id: true,
                name: true,
                description: true,
                tag: true,
                isPublished: true,
                createdAt: true,
                updatedAt: true,
                categories: {
                    include: {
                        items: true
                    }
                },
                _count: {
                    select: {
                        categories: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Procesar los datos para incluir estadísticas básicas
        const processedForms = forms.map(form => {
            const totalItems = form.categories.reduce((sum: number, cat) => sum + cat.items.length, 0);

            return {
                ...form,
                stats: {
                    totalItems,
                    totalCategories: form.categories.length
                }
            };
        });

        return NextResponse.json({
            module: moduleData,
            forms: processedForms,
            message: "Forms retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching forms:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/modules/[moduleId]/forms  
 * Crea un nuevo formulario en el módulo (solo admin)
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ moduleId: string }> }
) {
    const { moduleId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo admin puede crear formularios
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const moduleIdInt = parseInt(moduleId);
        
        if (isNaN(moduleIdInt)) {
            return NextResponse.json(
                { error: "Invalid module ID" },
                { status: 400 }
            );
        }

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Form name is required" },
                { status: 400 }
            );
        }

        // Verificar que el módulo existe
        const moduleExists = await prisma.module.findUnique({
            where: { id: moduleIdInt },
            select: { id: true }
        });

        if (!moduleExists) {
            return NextResponse.json(
                { error: "Module not found" },
                { status: 404 }
            );
        }

        const form = await prisma.form.create({
            data: {
                name,
                description: description || null,
                moduleId: moduleIdInt
            },
            include: {
                categories: true,
                _count: {
                    select: {
                        categories: true,
                        personalizedForms: true
                    }
                }
            }
        });

        return NextResponse.json({
            form,
            message: "Form created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating form:", error);
        
        const { message, status } = handlePrismaError(error);
        return NextResponse.json({ error: message }, { status });
    }
}
