"use client";
import React from "react";
import ItemEditor from "../ItemEditor";
import { Trash2 } from "lucide-react";

export default function CategoryEditor({
  categories,
  onAddCategory,
  onDeleteCategory,
  onCategoryChange,
  onItemChange,
}: {
  categories: { name: string; description: string; items: string[] }[];
  onAddCategory: () => void;
  onDeleteCategory: (index: number) => void;
  onCategoryChange: (index: number, field: string, value: string) => void;
  onItemChange: (categoryIndex: number, items: string[]) => void;
}) {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Categorías</h3>
        <button
          onClick={onAddCategory}
          className="px-3 py-2 bg-black text-white rounded-lg"
        >
          + Agregar Categoría
        </button>
      </div>

      {categories.map((cat, index) => (
        <div
          key={index}
          className="border border-gray-300 rounded-xl p-4 mb-6 bg-white shadow-sm"
        >
          <div className="flex justify-between items-center mb-3">
            <input
              type="text"
              value={cat.name}
              placeholder="Nombre de la categoría"
              onChange={(e) =>
                onCategoryChange(index, "name", e.target.value)
              }
              className="flex-1 border border-gray-300 rounded-lg p-2"
            />
            <button
              onClick={() => onDeleteCategory(index)}
              className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <textarea
            placeholder="Descripción (opcional)"
            value={cat.description}
            onChange={(e) =>
              onCategoryChange(index, "description", e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg p-2 mb-2"
          />

          <ItemEditor
            items={cat.items}
            onAddItem={() => {
              const newItems = [...cat.items, ""];
              onItemChange(index, newItems);
            }}
            onDeleteItem={(i) => {
              const newItems = cat.items.filter((_, idx) => idx !== i);
              onItemChange(index, newItems);
            }}
            onItemChange={(i, value) => {
              const newItems = cat.items.map((it, idx) =>
                idx === i ? value : it
              );
              onItemChange(index, newItems);
            }}
          />
        </div>
      ))}
    </div>
  );
}
