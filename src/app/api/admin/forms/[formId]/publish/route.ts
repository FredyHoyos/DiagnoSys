import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/forms/[formId]/publish
 * Publicar o despublicar formulario base (solo admin)
 */
export async function PATCH(
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

        // Solo admin puede publicar formularios base
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

        const { isPublished } = await request.json();

        if (typeof isPublished !== 'boolean') {
            return NextResponse.json(
                { error: "isPublished must be a boolean" },
                { status: 400 }
            );
        }

        // Verificar que el formulario tenga al menos una categoría con items antes de publicar
        if (isPublished) {
            const formWithContent = await prisma.form.findUnique({
                where: { id: formIdInt },
                include: {
                    categories: {
                        include: {
                            items: true
                        }
                    }
                }
            });

            if (!formWithContent) {
                return NextResponse.json(
                    { error: "Form not found" },
                    { status: 404 }
                );
            }

            const hasContent = formWithContent.categories.some(cat => cat.items.length > 0);
            
            if (!hasContent) {
                return NextResponse.json(
                    { error: "Cannot publish form without categories and items" },
                    { status: 400 }
                );
            }
        }

        const form = await prisma.form.update({
            where: { id: formIdInt },
            data: {
                isPublished
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
            message: `Form ${isPublished ? 'published' : 'unpublished'} successfully`
        });

    } catch (error) {
        console.error("Error publishing/unpublishing form:", error);
        
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
