import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/forms/[formId]
 * Ver formulario base completo (solo admin)
 */
export async function GET(
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

        // Solo admin puede ver formularios base completos
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const formIdInt = parseInt(formId);
        
        if (isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        const form = await prisma.form.findUnique({
            where: { id: formIdInt },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                categories: {
                    include: {
                        items: {
                            orderBy: {
                                createdAt: 'asc'
                            }
                        },
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
                        personalizedForms: true
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

        // Calcular estadísticas
        const totalItems = form.categories.reduce((sum, cat) => sum + cat.items.length, 0);

        const result = {
            id: form.id,
            name: form.name,
            description: form.description,
            isPublished: form.isPublished,
            module: form.module,
            categories: form.categories.map(category => ({
                id: category.id,
                name: category.name,
                items: category.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                })),
                itemsCount: category.items.length,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
            })),
            stats: {
                totalCategories: form.categories.length,
                totalItems: totalItems,
                personalizedCount: form._count.personalizedForms
            },
            createdAt: form.createdAt,
            updatedAt: form.updatedAt
        };

        return NextResponse.json({
            form: result,
            message: "Form retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching admin form:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/forms/[formId]
 * Editar título y descripción del formulario base (solo admin)
 */
export async function PUT(
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

        // Solo admin puede editar formularios base
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const formIdInt = parseInt(formId);
        
        if (isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const form = await prisma.form.update({
            where: { id: formIdInt },
            data: {
                name,
                description: description || null
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
                    totalCategories: form._count.categories,
                    personalizedCount: form._count.personalizedForms
                },
                updatedAt: form.updatedAt
            },
            message: "Form updated successfully"
        });

    } catch (error) {
        console.error("Error updating admin form:", error);
        
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

/**
 * DELETE /api/admin/forms/[formId]
 * Eliminar formulario base (solo admin)
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

        // Solo admin puede eliminar formularios base
        if (session.user.role?.name !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const formIdInt = parseInt(formId);
        
        if (isNaN(formIdInt)) {
            return NextResponse.json(
                { error: "Invalid form ID" },
                { status: 400 }
            );
        }

        // Verificar si hay formularios personalizados basados en este
        const personalizedCount = await prisma.personalizedForm.count({
            where: { baseFormId: formIdInt }
        });

        if (personalizedCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete form. ${personalizedCount} personalized forms depend on it.` },
                { status: 409 }
            );
        }

        await prisma.form.delete({
            where: { id: formIdInt }
        });

        return NextResponse.json({
            message: "Form deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting admin form:", error);
        
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
            return NextResponse.json(
                { error: "Form not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
