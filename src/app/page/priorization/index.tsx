"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Note {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  title: string;
  color: string;
  notes: Note[];
}

interface FormResponse {
  id: number;
  name: string;
  categories: {
    id: number;
    name: string;
  }[];
}

export default function PriorityQuadrants() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [quadrants, setQuadrants] = useState<{
    q1: Note[]; // Alta prioridad
    q2: Note[]; // Media prioridad (arriba izquierda)
    q3: Note[]; // Baja prioridad
    q4: Note[]; // Media prioridad (abajo derecha)
  }>({
    q1: [],
    q2: [],
    q3: [],
    q4: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch("/api/modules/2/forms");
        if (!res.ok) throw new Error("Failed to fetch forms");

        const data: { forms: FormResponse[] } = await res.json();

        const colorPairs: [string, string][] = [
          ["bg-pink-100", "bg-pink-500"],
          ["bg-green-100", "bg-green-500"],
          ["bg-yellow-100", "bg-yellow-500"],
          ["bg-blue-100", "bg-blue-500"],
        ];

        const mappedCategories: Category[] = data.forms.map((form, index) => {
          const [light, dark] = colorPairs[index % colorPairs.length];
          return {
            id: form.id.toString(),
            title: form.name,
            color: light,
            notes: form.categories.map((cat) => ({
              id: cat.id.toString(),
              name: cat.name,
              color: dark,
            })),
          };
        });

        setCategories(mappedCategories);
      } catch (err) {
        console.error("Error fetching forms", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newCategories = [...categories];
    const newQuadrants = { ...quadrants };
    let draggedNote: Note | null = null;

    if (source.droppableId.startsWith("category-")) {
      const sourceCategoryId = source.droppableId.split("-")[1];
      const sourceCategory = newCategories.find((c) => c.id === sourceCategoryId);
      if (!sourceCategory) return;
      [draggedNote] = sourceCategory.notes.splice(source.index, 1);
    } else if (source.droppableId.startsWith("q")) {
      const key = source.droppableId as keyof typeof quadrants;
      [draggedNote] = newQuadrants[key].splice(source.index, 1);
    }

    if (!draggedNote) return;

    if (destination.droppableId.startsWith("category-")) {
      const destCategoryId = destination.droppableId.split("-")[1];
      const destCategory = newCategories.find((c) => c.id === destCategoryId);
      if (!destCategory) return;
      destCategory.notes.splice(destination.index, 0, draggedNote);
    } else if (destination.droppableId.startsWith("q")) {
      const key = destination.droppableId as keyof typeof quadrants;
      newQuadrants[key].splice(destination.index, 0, draggedNote);
    }

    setCategories(newCategories);
    setQuadrants(newQuadrants);
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading data...</p>;

  const allNotes = categories.flatMap((c) => c.notes);
  const allDestNotes = [...quadrants.q1, ...quadrants.q2, ...quadrants.q3, ...quadrants.q4];
  const allAssigned = allNotes.length === 0 && allDestNotes.length > 0;

  const handleSave = async () => {
    const payload = quadrants;
    console.log("Saved data:", payload);
    try {
      const res = await fetch("/api/modules/2/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error saving data");
      alert("Data saved successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Error saving data ❌");
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Zoom <span className="text-blue-600">Out:</span> Prioritization Matrix
      </h1>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Categorías iniciales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {categories.map((category) => (
            <div key={category.id} className={`${category.color} rounded-xl p-4 shadow-md`}>
              <h2 className="font-semibold text-gray-800 mb-2 text-lg">{category.title}</h2>
              <Droppable droppableId={`category-${category.id}`}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-2">
                    {category.notes.map((note, index) => (
                      <Draggable key={note.id} draggableId={note.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`px-3 py-2 ${note.color} text-white rounded-md shadow cursor-pointer`}
                          >
                            {note.name}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>

        {/* MATRIZ DE 4 CUADRANTES */}
        <div className="relative w-full md:w-[800px] mx-auto">
          {/* Ejes */}
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 -rotate-90 text-gray-700 font-bold">
            Low Impact - High Impact
          </div>
          <div className="absolute bottom-0 left-1/2 translate-x-[-50%] translate-y-8 text-gray-700 font-bold">
            Low urgency - High urgency
          </div>

          {/* Cuadrantes */}
          <div className="grid grid-cols-2 grid-rows-2 border border-gray-500">
            {([
              { id: "q2", title: "Medium priority", color: "bg-yellow-300" },
              { id: "q1", title: "High priority", color: "bg-green-400" },
              { id: "q3", title: "Low priority", color: "bg-red-500" },
              { id: "q4", title: "Medium priority", color: "bg-yellow-300" },
            ] as const).map((q) => (
              <Droppable key={q.id} droppableId={q.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${q.color} border border-gray-400 min-h-[200px] flex flex-col items-center justify-center p-4 relative`}
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{q.title}</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quadrants[q.id as keyof typeof quadrants].map((note, index) => (
                        <Draggable key={note.id} draggableId={note.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`px-3 py-2 ${note.color} rounded-md shadow text-white`}
                            >
                              {note.name}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      <div className="mt-12 text-center">
        <button
          onClick={handleSave}
          disabled={!allAssigned}
          className={`px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
            allAssigned ? "bg-primary cursor-pointer" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
