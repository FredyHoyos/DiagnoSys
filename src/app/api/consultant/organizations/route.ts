import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/consultant/organizations
 * Ver organizaciones disponibles para auditar (solo consultant)
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

        // Solo consultores pueden ver organizaciones
        if (session.user.role?.name !== 'consultant') {
            return NextResponse.json(
                { error: "Consultant access required" },
                { status: 403 }
            );
        }

        const consultantId = parseInt(session.user.id);

        // Obtener organizaciones y sus auditorías relacionadas con este consultor
        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        audits: {
                            where: {
                                consultantId: consultantId
                            }
                        }
                    }
                },
                audits: {
                    where: {
                        consultantId: consultantId
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: {
                                personalizedForms: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Procesar datos
        const processedOrganizations = organizations.map(org => ({
            id: org.id,
            name: org.name,
            description: org.description,
            stats: {
                myAuditsCount: org._count.audits,
                totalFormsCount: org.audits.reduce((sum, audit) => sum + audit._count.personalizedForms, 0)
            },
            recentAudits: org.audits.slice(0, 3), // Solo las 3 más recientes
            createdAt: org.createdAt,
            updatedAt: org.updatedAt
        }));

        return NextResponse.json({
            organizations: processedOrganizations,
            message: "Organizations retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching consultant organizations:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/consultant/organizations
 * Crear nueva organización para auditar (solo consultant)
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

        // Solo consultores pueden crear organizaciones
        if (session.user.role?.name !== 'consultant') {
            return NextResponse.json(
                { error: "Consultant access required" },
                { status: 403 }
            );
        }

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Organization name is required" },
                { status: 400 }
            );
        }

        const organization = await prisma.organization.create({
            data: {
                name,
                description: description || null
            }
        });

        return NextResponse.json({
            organization: {
                id: organization.id,
                name: organization.name,
                description: organization.description,
                stats: {
                    myAuditsCount: 0,
                    totalFormsCount: 0
                },
                recentAudits: [],
                createdAt: organization.createdAt,
                updatedAt: organization.updatedAt
            },
            message: "Organization created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating organization:", error);
        
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
            return NextResponse.json(
                { error: "Organization name already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
