"use client";
import React, { useEffect, useState } from "react";
import TargetForm from "@/app/components/targetForm";
import TargetForm2 from "@/app/components/targetForm2";

type Category = {
  _count: {
    items: number;
  };
};

type Form = {
  id: string | number;
  name: string;
  description?: string;
  isPublished: boolean;
  _count: {
    categories: number;
  };
  categories: Category[];
};

export default function TargeticasPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch("/api/forms");
        const data = await res.json();

        if (res.ok) {
          // Asegurar que cada form tenga un array de categorías
          const safeForms = (data.forms || []).map((f: Form) => ({
            ...f,
            categories: f.categories || [],
          }));
          setForms(safeForms);
        } else {
          console.error("Error:", data.error);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  if (loading) return <p className="text-gray-500">Cargando formularios...</p>;

  // Cálculos seguros
  const totalCategories = forms?.reduce(
    (sum, f) => sum + (f._count?.categories || 0),
    0
  );

  const totalItems = forms?.reduce(
    (sum, f) =>
      sum +
      (f.categories?.reduce(
        (s, c) => s + (c._count?.items || 0),
        0
      ) || 0),
    0
  );

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Zoom-in Administration</h1>
      <p className="text-gray-600 mb-4">Manage forms, categories, and items</p>

      {/* Tarjeta de resumen global */}
      <TargetForm
        formsCount={forms.length}
        categoriesCount={totalCategories}
        itemsCount={totalItems}
      />

      <h2 className="text-2xl font-semibold mb-4 pt-20">Forms</h2>

      <div className="flex justify-center flex-wrap gap-8">
        {forms.length === 0 ? (
          <p className="text-gray-500">No hay formularios disponibles.</p>
        ) : (
          forms.map((form) => (
            <TargetForm2
              key={form.id}
              title={form.name}
              description={form.description || "Sin descripción"}
              publicF={form.isPublished}
              categorieNumber={form._count?.categories || 0}
              itemNumber={
                form.categories?.reduce(
                  (s, c) => s + (c._count?.items || 0),
                  0
                ) || 0
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
