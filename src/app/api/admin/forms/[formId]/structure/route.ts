import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

interface CategoryStructure {
    id?: number;
    name: string;
    items: ItemStructure[];
}

interface ItemStructure {
    id?: number;
    name: string;
}

/**
 * PUT /api/admin/forms/[formId]/structure
 * Actualizar estructura completa del formulario (categorías + items)
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

        // Solo admin puede actualizar estructura de formularios base
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

        const { categories }: { categories: CategoryStructure[] } = await request.json();

        if (!categories || !Array.isArray(categories)) {
            return NextResponse.json(
                { error: "Categories array is required" },
                { status: 400 }
            );
        }

        // Verificar que el formulario existe
        const existingForm = await prisma.form.findUnique({
            where: { id: formIdInt }
        });

        if (!existingForm) {
            return NextResponse.json(
                { error: "Form not found" },
                { status: 404 }
            );
        }

        // Usar transacción para actualizar toda la estructura
        const result = await prisma.$transaction(async (tx) => {
            // 1. Eliminar todas las categorías existentes (cascade eliminará items)
            await tx.category.deleteMany({
                where: { formId: formIdInt }
            });

            // 2. Crear nuevas categorías con items
            const createdCategories = [];
            
            for (const categoryData of categories) {
                const category = await tx.category.create({
                    data: {
                        name: categoryData.name,
                        formId: formIdInt,
                        items: {
                            create: categoryData.items.map(item => ({
                                name: item.name
                            }))
                        }
                    },
                    include: {
                        items: {
                            orderBy: {
                                createdAt: 'asc'
                            }
                        }
                    }
                });
                
                createdCategories.push(category);
            }

            // 3. Obtener formulario actualizado completo
            const updatedForm = await tx.form.findUnique({
                where: { id: formIdInt },
                include: {
                    module: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    categories: {
                        include: {
                            items: {
                                orderBy: {
                                    createdAt: 'asc'
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

            return updatedForm;
        });

        if (!result) {
            throw new Error("Failed to update form structure");
        }

        // Calcular estadísticas
        const totalItems = result.categories.reduce((sum, cat) => sum + cat.items.length, 0);

        const responseForm = {
            id: result.id,
            name: result.name,
            description: result.description,
            isPublished: result.isPublished,
            module: result.module,
            categories: result.categories.map(category => ({
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
                totalCategories: result.categories.length,
                totalItems: totalItems,
                personalizedCount: result._count.personalizedForms
            },
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
        };

        return NextResponse.json({
            form: responseForm,
            message: "Form structure updated successfully"
        });

    } catch (error) {
        console.error("Error updating form structure:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
