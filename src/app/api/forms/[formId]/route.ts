import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/forms/[formId]
 * Obtiene un formulario específico con todas sus categorías e items.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  const { formId } = await context.params;
  
  try {
    const formIdInt = parseInt(formId);
    if (isNaN(formIdInt)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    // Obtener información del usuario si está autenticado
    const session = await getServerSession(authOptions);
    let userId: number | null = null;
    
    if (session?.user?.id) {
      userId = parseInt(session.user.id);
    }

    const form = await prisma.form.findUnique({
      where: { id: formIdInt },
      include: {
        categories: {
          include: {
            items: {
              include: {
                _count: {
                  select: {
                    personalizedItems: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        personalizedForms: userId ? {
          where: { 
            userId: userId,
            baseFormId: formIdInt
          },
          select: {
            id: true,
            name: true,
            isCompleted: true,
            createdAt: true,
            updatedAt: true,
            completedAt: true,
          },
        } : false,
        _count: { select: { categories: true, personalizedForms: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const totalItems = form.categories.reduce(
      (sum: number, cat: { items: { length: number } }) => sum + cat.items.length,
      0
    );

    const userScoredItems = 0; // Simplificado por ahora

    const completionPercentage = totalItems > 0 ? Math.round((userScoredItems / totalItems) * 100) : 0;

    return NextResponse.json({
      form: {
        ...form,
        stats: {
          totalCategories: form.categories.length,
          totalItems,
          userScoredItems,
          completionPercentage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forms/[formId]
 * Actualiza un formulario completo incluyendo su estructura.
 * Maneja título, descripción, categorías e items.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  const { formId } = await context.params;

  try {
    // Verificar autenticación y rol de administrador
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Verificar que el usuario sea administrador
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { role: true }
    });

    if (!user || user.role.name !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: "Forbidden - Admin access required" 
      }, { status: 403 });
    }

    const formIdInt = parseInt(formId);
    if (isNaN(formIdInt)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid form ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, categories } = body;

    console.log("=== PUT /api/forms/[formId] ===");
    console.log("Form ID:", formId);
    console.log("Data received:", { title, description, categories });

    // Validar datos requeridos
    if (!title?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: "El título es requerido" 
      }, { status: 400 });
    }

    if (!Array.isArray(categories)) {
      return NextResponse.json({ 
        success: false,
        error: "Las categorías deben ser un array" 
      }, { status: 400 });
    }

    // Verificar que el formulario existe
    const existingForm = await prisma.form.findUnique({
      where: { id: formIdInt },
      include: {
        categories: {
          include: { items: true }
        }
      }
    });

    if (!existingForm) {
      return NextResponse.json({ 
        success: false,
        error: "Form not found" 
      }, { status: 404 });
    }

    // Usar transacción con timeout de 10 segundos (límite de Accelerate: 15s)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar formulario base
      const updatedForm = await tx.form.update({
        where: { id: formIdInt },
        data: {
          name: title.trim(),
          description: description?.trim() || "",
          updatedAt: new Date()
        },
      });

      console.log("✅ Formulario base actualizado:", updatedForm.name);

      // 2. Obtener categorías actuales con sus items
      const currentCategories = await tx.category.findMany({
        where: { formId: formIdInt },
        include: { items: true },
      });

      console.log("📁 Categorías actuales:", currentCategories.length);

      // 3. Procesar cada categoría del request de manera más eficiente
      const processedCategoryIds: number[] = [];
      const processedCategoryNames: string[] = []; // Para prevenir duplicados
      const categoriesOperations = [];

      for (let i = 0; i < categories.length; i++) {
        const categoryData = categories[i];
        
        if (!categoryData.name?.trim()) {
          console.log(`⚠️ Saltando categoría ${i} sin nombre`);
          continue; // Saltar categorías sin nombre
        }

        const trimmedName = categoryData.name.trim();
        
        // Verificar si ya procesamos este nombre
        if (processedCategoryNames.includes(trimmedName.toLowerCase())) {
          console.log(`⚠️ Saltando categoría duplicada: "${trimmedName}"`);
          continue;
        }

        // Buscar categoría existente por nombre (case insensitive)
        const existingCategory = currentCategories.find(
          cat => cat.name.toLowerCase().trim() === trimmedName.toLowerCase()
        );

        if (existingCategory) {
          // Solo actualizar si el nombre cambió
          if (existingCategory.name !== trimmedName) {
            categoriesOperations.push(
              tx.category.update({
                where: { id: existingCategory.id },
                data: { 
                  name: trimmedName,
                  updatedAt: new Date()
                },
              })
            );
            console.log("✏️ Programada actualización de categoría:", `"${existingCategory.name}" → "${trimmedName}"`);
          } else {
            console.log("➡️ Categoría sin cambios:", existingCategory.name);
          }
          processedCategoryIds.push(existingCategory.id);
        } else {
          // Crear nueva categoría
          categoriesOperations.push(
            tx.category.create({
              data: {
                name: trimmedName,
                formId: formIdInt,
              },
            })
          );
          console.log("✨ Programada creación de categoría:", trimmedName);
        }

        processedCategoryNames.push(trimmedName.toLowerCase());
      }

      // Ejecutar operaciones de categorías en batch
      if (categoriesOperations.length > 0) {
        await Promise.all(categoriesOperations);
        console.log(`🚀 Ejecutadas ${categoriesOperations.length} operaciones de categorías`);
      }

      // 4. Recargar categorías después de las actualizaciones/creaciones
      const updatedCategories = await tx.category.findMany({
        where: { formId: formIdInt },
        include: { items: true },
      });

      // 5. Procesar items de manera eficiente
      for (let i = 0; i < categories.length; i++) {
        const categoryData = categories[i];
        
        if (!categoryData.name?.trim()) continue;
        
        const trimmedCategoryName = categoryData.name.trim();
        
        // Verificar si esta categoría fue procesada (no duplicada)
        if (!processedCategoryNames.includes(trimmedCategoryName.toLowerCase())) continue;

        const category = updatedCategories.find(
          cat => cat.name.toLowerCase().trim() === trimmedCategoryName.toLowerCase()
        );

        if (!category) continue;

        // Añadir al tracking de categorías procesadas
        if (!processedCategoryIds.includes(category.id)) {
          processedCategoryIds.push(category.id);
        }

        if (Array.isArray(categoryData.items)) {
          const currentItems = category.items;
          const itemsOperations = [];
          const processedItemIds: number[] = [];
          const processedItemNames: string[] = []; // Para prevenir duplicados

          // Procesar cada item del request
          for (let j = 0; j < categoryData.items.length; j++) {
            const itemName = categoryData.items[j];
            
            if (!itemName?.trim()) continue;

            const trimmedName = itemName.trim();
            
            // Verificar si ya procesamos este nombre en esta categoría
            if (processedItemNames.includes(trimmedName.toLowerCase())) {
              console.log(`  ⚠️ Saltando item duplicado: "${trimmedName}" en categoría "${category.name}"`);
              continue;
            }

            const existingItem = currentItems.find(
              item => item.name.toLowerCase().trim() === trimmedName.toLowerCase()
            );

            if (existingItem) {
              if (existingItem.name !== trimmedName) {
                itemsOperations.push(
                  tx.item.update({
                    where: { id: existingItem.id },
                    data: { 
                      name: trimmedName,
                      updatedAt: new Date()
                    },
                  })
                );
                console.log(`  ✏️ Programada actualización de item: "${existingItem.name}" → "${trimmedName}"`);
              }
              processedItemIds.push(existingItem.id);
            } else {
              itemsOperations.push(
                tx.item.create({
                  data: {
                    name: trimmedName,
                    categoryId: category.id,
                  },
                })
              );
              console.log(`  ✨ Programada creación de item: "${trimmedName}"`);
            }

            processedItemNames.push(trimmedName.toLowerCase());
          }

          // Ejecutar operaciones de items en batch
          if (itemsOperations.length > 0) {
            await Promise.all(itemsOperations);
            console.log(`  🚀 Ejecutadas ${itemsOperations.length} operaciones de items para "${category.name}"`);
          }

          // Eliminar items que ya no están en el request
          const itemsToDelete = currentItems.filter(
            item => !processedItemIds.includes(item.id)
          );

          if (itemsToDelete.length > 0) {
            // Eliminar PersonalizedItems primero
            await tx.personalizedItem.deleteMany({
              where: { 
                baseItemId: { 
                  in: itemsToDelete.map(item => item.id) 
                }
              }
            });

            // Luego eliminar los items
            await tx.item.deleteMany({
              where: { 
                id: { 
                  in: itemsToDelete.map(item => item.id) 
                }
              }
            });

            console.log(`  🗑️ Eliminados ${itemsToDelete.length} items de "${category.name}"`);
          }
        }
      }

      // 6. Eliminar categorías que ya no están en el request
      const categoriesToDelete = updatedCategories.filter(
        category => !processedCategoryIds.includes(category.id)
      );

      if (categoriesToDelete.length > 0) {
        const categoryIdsToDelete = categoriesToDelete.map(cat => cat.id);
        
        // Eliminar PersonalizedItems de todos los items de estas categorías
        await tx.personalizedItem.deleteMany({
          where: { 
            baseItem: { 
              categoryId: { in: categoryIdsToDelete }
            }
          }
        });

        // Eliminar todos los items de estas categorías
        await tx.item.deleteMany({
          where: { categoryId: { in: categoryIdsToDelete } },
        });

        // Eliminar PersonalizedCategories
        await tx.personalizedCategory.deleteMany({
          where: { baseCategoryId: { in: categoryIdsToDelete } },
        });

        // Eliminar las categorías
        await tx.category.deleteMany({
          where: { id: { in: categoryIdsToDelete } },
        });

        console.log(`�️ Eliminadas ${categoriesToDelete.length} categorías completas`);
      }

      // 7. Retornar formulario actualizado
      return await tx.form.findUnique({
        where: { id: formIdInt },
        include: {
          categories: {
            include: { items: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }, {
      timeout: 10000, // 10 segundos (bajo el límite de Accelerate)
    });

    console.log("🎉 Transacción completada exitosamente");

    return NextResponse.json({
      success: true,
      message: "Formulario actualizado correctamente",
      form: result,
    });

  } catch (error) {
    console.error("❌ Error updating form:", error);
    
    // Retornar error específico
    return NextResponse.json(
      { 
        success: false,
        error: "Error al actualizar el formulario", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
