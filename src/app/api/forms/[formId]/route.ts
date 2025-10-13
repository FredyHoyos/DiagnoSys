import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/forms/[formId]
 * Obtiene un formulario específico con todas sus categorías e ítems.
 * Incluye los puntajes del usuario si existen.
 */
export async function GET(
  request: NextRequest,
  context: { params: { formId: string } }
) {
  const { formId } = context.params;

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    const formIdInt = parseInt(formId);
    if (isNaN(formIdInt)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    // Obtener el formulario completo
    const form = await prisma.form.findUnique({
      where: { id: formIdInt },
      include: {
        module: {
          select: { id: true, name: true, description: true },
        },
        categories: {
          include: {
            items: {
              include: {
                ...(userId
                  ? {
                      userScores: {
                        where: { userId },
                        select: {
                          id: true,
                          score: true,
                          createdAt: true,
                          updatedAt: true,
                        },
                      },
                    }
                  : {}),
                _count: {
                  select: {
                    userScores: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        ...(userId
          ? {
              userSessions: {
                where: { userId, isCompleted: true },
                select: {
                  id: true,
                  createdAt: true,
                  updatedAt: true,
                  completedAt: true,
                },
              },
            }
          : { userSessions: { where: { id: 0 } } }),
        _count: { select: { categories: true, userSessions: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const totalItems = form.categories.reduce(
      (sum, cat) => sum + cat.items.length,
      0
    );

    const userScoredItems = form.categories.reduce(
      (sum, cat) =>
        sum +
        cat.items.filter((item) =>
          item.userScores?.some((score) => score.score !== null)
        ).length,
      0
    );

    const isCompleted = form.userSessions?.length > 0;
    const completionPercentage =
      totalItems > 0
        ? Math.round((userScoredItems / totalItems) * 100)
        : 0;

    const processedCategories = form.categories.map((category) => {
      const categoryUserScoredItems = category.items.filter((item) =>
        item.userScores?.some((score) => score.score !== null)
      ).length;

      const categoryCompletionPercentage =
        category.items.length > 0
          ? Math.round(
              (categoryUserScoredItems / category.items.length) * 100
            )
          : 0;

      return {
        ...category,
        stats: {
          totalItems: category.items.length,
          userScoredItems: categoryUserScoredItems,
          completionPercentage: categoryCompletionPercentage,
        },
      };
    });

    const result = {
      ...form,
      categories: processedCategories,
      stats: {
        totalItems,
        userScoredItems,
        completionPercentage,
        isCompleted,
        lastActivity: form.userSessions?.[0]?.completedAt || null,
        totalCategories: form.categories.length,
      },
    };

    return NextResponse.json({
      form: result,
      message: "Form retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
