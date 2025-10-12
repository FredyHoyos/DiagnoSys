import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/consultant/forms
 * Ver formularios base publicados (solo consultant)
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

        // Solo consultores pueden ver formularios base publicados
        if (session.user.role?.name !== 'consultant') {
            return NextResponse.json(
                { error: "Consultant access required" },
                { status: 403 }
            );
        }

        const forms = await prisma.form.findMany({
            where: {
                isPublished: true // Solo formularios publicados
            },
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
                        categories: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Procesar datos para incluir estadísticas útiles para el consultor
        const processedForms = forms.map(form => {
            const totalItems = form.categories.reduce((sum, cat) => sum + cat.items.length, 0);
            
            return {
                id: form.id,
                name: form.name,
                description: form.description,
                module: form.module,
                categories: form.categories.map(category => ({
                    id: category.id,
                    name: category.name,
                    items: category.items.map(item => ({
                        id: item.id,
                        name: item.name
                    })),
                    itemsCount: category.items.length
                })),
                stats: {
                    totalCategories: form.categories.length,
                    totalItems: totalItems
                },
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
            };
        });

        return NextResponse.json({
            forms: processedForms,
            message: "Published forms retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching consultant forms:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
