"use client";
import React from "react";
import { Trash2 } from "lucide-react";

export default function ItemEditor({
  items,
  onAddItem,
  onDeleteItem,
  onItemChange,
}: {
  items: string[];
  onAddItem: () => void;
  onDeleteItem: (index: number) => void;
  onItemChange: (index: number, value: string) => void;
}) {
  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-gray-700 font-semibold">Ítems</h4>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={item}
            onChange={(e) => onItemChange(index, e.target.value)}
            placeholder="Nombre del ítem"
            className="flex-1 border border-gray-300 rounded-lg p-2"
          />
          <button
            onClick={() => onDeleteItem(index)}
            className="p-2 text-red-600 hover:bg-red-100 rounded"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <button
        onClick={onAddItem}
        className="mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        + Agregar Ítem
      </button>
    </div>
  );
}
