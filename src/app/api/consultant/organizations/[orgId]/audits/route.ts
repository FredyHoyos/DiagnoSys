import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/consultant/organizations/[orgId]/audits
 * Ver auditorías de una organización específica (solo consultant)
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo consultores pueden ver auditorías
        if (session.user.role?.name !== 'consultant') {
            return NextResponse.json(
                { error: "Consultant access required" },
                { status: 403 }
            );
        }

        const orgIdInt = parseInt(orgId);
        const consultantId = parseInt(session.user.id);
        
        if (isNaN(orgIdInt)) {
            return NextResponse.json(
                { error: "Invalid organization ID" },
                { status: 400 }
            );
        }

        // Verificar que la organización existe
        const organization = await prisma.organization.findUnique({
            where: { id: orgIdInt },
            select: {
                id: true,
                name: true,
                description: true
            }
        });

        if (!organization) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        // Obtener auditorías de este consultor para esta organización
        const audits = await prisma.audit.findMany({
            where: {
                organizationId: orgIdInt,
                consultantId: consultantId
            },
            include: {
                personalizedForms: {
                    include: {
                        baseForm: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        _count: {
                            select: {
                                personalizedCategories: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        personalizedForms: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Procesar datos
        const processedAudits = audits.map(audit => {
            const completedForms = audit.personalizedForms.filter(form => form.isCompleted).length;
            const totalProgress = audit.personalizedForms.reduce((sum, form) => sum + form.progress, 0);
            const avgProgress = audit.personalizedForms.length > 0 ? totalProgress / audit.personalizedForms.length : 0;

            return {
                id: audit.id,
                name: audit.name,
                description: audit.description,
                organization: organization,
                stats: {
                    totalForms: audit._count.personalizedForms,
                    completedForms: completedForms,
                    avgProgress: Math.round(avgProgress * 100) / 100
                },
                forms: audit.personalizedForms.map(form => ({
                    id: form.id,
                    name: form.name,
                    baseForm: form.baseForm,
                    isCompleted: form.isCompleted,
                    progress: form.progress,
                    categoriesCount: form._count.personalizedCategories,
                    completedAt: form.completedAt,
                    updatedAt: form.updatedAt
                })),
                createdAt: audit.createdAt,
                updatedAt: audit.updatedAt
            };
        });

        return NextResponse.json({
            organization: organization,
            audits: processedAudits,
            message: "Audits retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching organization audits:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/consultant/organizations/[orgId]/audits
 * Crear nueva auditoría para una organización (solo consultant)
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Solo consultores pueden crear auditorías
        if (session.user.role?.name !== 'consultant') {
            return NextResponse.json(
                { error: "Consultant access required" },
                { status: 403 }
            );
        }

        const orgIdInt = parseInt(orgId);
        const consultantId = parseInt(session.user.id);
        
        if (isNaN(orgIdInt)) {
            return NextResponse.json(
                { error: "Invalid organization ID" },
                { status: 400 }
            );
        }

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Audit name is required" },
                { status: 400 }
            );
        }

        // Verificar que la organización existe
        const organization = await prisma.organization.findUnique({
            where: { id: orgIdInt }
        });

        if (!organization) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        const audit = await prisma.audit.create({
            data: {
                name,
                description: description || null,
                consultantId: consultantId,
                organizationId: orgIdInt
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        });

        return NextResponse.json({
            audit: {
                id: audit.id,
                name: audit.name,
                description: audit.description,
                organization: audit.organization,
                stats: {
                    totalForms: 0,
                    completedForms: 0,
                    avgProgress: 0
                },
                forms: [],
                createdAt: audit.createdAt,
                updatedAt: audit.updatedAt
            },
            message: "Audit created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating audit:", error);
        
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
            return NextResponse.json(
                { error: "Audit name already exists for this consultant and organization" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
