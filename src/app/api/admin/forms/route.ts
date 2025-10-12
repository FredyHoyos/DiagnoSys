import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/forms
 * Listar todos los formularios base (solo admin)
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

        // Solo admin puede ver formularios base
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const forms = await prisma.form.findMany({
            include: {
                module: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                categories: {
                    include: {
                        items: true,
                        _count: {
                            select: {
                                items: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                _count: {
                    select: {
                        categories: true,
                        personalizedForms: true // Cuántos usuarios han personalizado este formulario
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Procesar datos para incluir estadísticas
        const processedForms = forms.map(form => {
            const totalItems = form.categories.reduce((sum, cat) => sum + cat.items.length, 0);
            
            return {
                id: form.id,
                name: form.name,
                description: form.description,
                isPublished: form.isPublished,
                module: form.module,
                stats: {
                    totalCategories: form.categories.length,
                    totalItems: totalItems,
                    personalizedCount: form._count.personalizedForms // Cuántos usuarios lo han personalizado
                },
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
            };
        });

        return NextResponse.json({
            forms: processedForms,
            message: "Forms retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching admin forms:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/forms
 * Crear nuevo formulario base (solo admin)
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

        // Solo admin puede crear formularios base
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const { name, description, moduleId } = await request.json();

        if (!name || !moduleId) {
            return NextResponse.json(
                { error: "Name and moduleId are required" },
                { status: 400 }
            );
        }

        // Verificar que el módulo existe
        const moduleExists = await prisma.module.findUnique({
            where: { id: parseInt(moduleId) }
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
                moduleId: parseInt(moduleId),
                isPublished: false // Los formularios inician como no publicados
            },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        categories: true,
                        personalizedForms: true
                    }
                }
            }
        });

        return NextResponse.json({
            form: {
                id: form.id,
                name: form.name,
                description: form.description,
                isPublished: form.isPublished,
                module: form.module,
                stats: {
                    totalCategories: 0,
                    totalItems: 0,
                    personalizedCount: 0
                },
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
            },
            message: "Form created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating admin form:", error);
        
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
            return NextResponse.json(
                { error: "Form name already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
