"use client";
import React from "react";

export default function FormHeader({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: {
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <div className="p-6 border rounded-xl bg-white shadow">
      <h2 className="text-2xl font-bold mb-4">Editar Formulario</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Título
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Descripción
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2"
            rows={3}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
