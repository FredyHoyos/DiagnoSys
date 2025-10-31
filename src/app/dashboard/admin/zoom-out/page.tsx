"use client";
import React, { useEffect, useState } from "react";
import TargetForm from "@/app/components/targetForm";
import TargetForm2 from "@/app/components/targetForm2";

type Category = {
  id: number;
  name: string;
  items: Array<{
    id: number;
    name: string;
  }>;
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
  module: {
    id: number;
    name: string;
  };
};

export default function AdminZoomOutPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZoomOutForms = async () => {
      try {
        // Obtener formularios del módulo "Zoom Out" con datos completos
        const modulesRes = await fetch("/api/modules");
        const modulesData = await modulesRes.json();

        if (modulesRes.ok) {
          const zoomOutModule = modulesData.modules?.find((module: { name: string; id: number }) =>
            module.name.toLowerCase().includes("zoom out") ||
            module.name.toLowerCase().includes("zoom-out")
          );

          if (zoomOutModule) {
            // Obtener formularios con datos completos incluyendo categorías e items
            const formsRes = await fetch(`/api/modules/${zoomOutModule.id}/forms`);
            const formsData = await formsRes.json();

            if (formsRes.ok) {
              const formsWithCounts = formsData.forms || [];
              setForms(formsWithCounts.map((f: Form) => ({
                ...f,
                categories: f.categories || [],
                _count: {
                  categories: f.categories?.length || 0
                }
              })));
            } else {
              setError(formsData.error || "Error al cargar formularios");
            }
          } else {
            setError("Módulo Zoom Out no encontrado");
          }
        } else {
          setError(modulesData.error || "Error al cargar módulos");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    fetchZoomOutForms();
  }, []);

  if (loading) {
    return (
      <div className="max-h-screen w-full">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2E6347]">Admin - Zoom Out</h1>
            <p className="mt-2 text-lg text-black">
              Manage forms to identify external forces that exert positive or negative pressure on the business model.
              <br /> Analyzing them allows you to anticipate risks, take advantage of opportunities, and adapt the organization&apos;s digital strategy.
            </p>
          </div>

          {/* Skeleton para las estadísticas */}
          <div className='flex flex-wrap justify-around gap-4 rounded-lg p-6 mb-8'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='flex flex-row space-x-3 rounded-lg border border-gray-300 p-4 shadow-sm w-48 items-center green-interactive animate-pulse'>
                <div className="bg-gray-300 rounded-md w-16 h-16"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4 pt-20 text-[#2E6347]">Forms</h2>

          {/* Skeleton para los formularios */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="green-interactive border border-gray-200 rounded-xl p-6 shadow-lg min-h-[260px] min-w-[350px] max-w-md animate-pulse">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="h-6 bg-gray-300 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-24 mb-6"></div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-300 rounded-2xl flex-1"></div>
                  <div className="h-10 bg-gray-300 rounded-2xl flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-h-screen w-full">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Safe calculations using real category data
  const totalCategories = forms?.reduce(
    (sum, f) => sum + (f.categories?.length || 0),
    0
  );

  const totalItems = forms?.reduce(
    (sum, f) =>
      sum +
      (f.categories?.reduce(
        (s, c) => s + (c.items?.length || 0),
        0
      ) || 0),
    0
  );

  return (
    <div className="max-h-screen w-full">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2E6347]">Admin - Zoom Out</h1>
          <p className="mt-2 text-lg  text-black">
            Manage forms to identify external forces that exert positive or negative pressure on the business model.
            <br /> Analyzing them allows you to anticipate risks, take advantage of opportunities, and adapt the organization&apos;s digital strategy.
          </p>
        </div>

        {/* Global Summary Card */}
        <TargetForm
          formsCount={forms.length}
          categoriesCount={totalCategories}
          itemsCount={totalItems}
        />

        <h2 className="text-2xl font-bold mb-4 pt-20 text-[#2E6347]">Forms</h2>

        <div className="grid lg:grid-cols-2 grid-cols-1 gap-6 justify-center">
          {forms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No forms available.</p>
              <p className="text-sm text-gray-400 mt-2">
                Forms will appear here once they are created in the Zoom Out module.
              </p>
            </div>
          ) : (
            forms.map((form) => (
              <TargetForm2
                key={form.id}
                title={form.name}
                description={form.description || "No description"}
                publicF={form.isPublished}
                categorieNumber={form.categories?.length || 0}
                itemNumber={
                  form.categories?.reduce(
                    (s, c) => s + (c.items?.length || 0),
                    0
                  ) || 0
                }
                formId={form.id.toString()}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
