'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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

export default function ZoomOutCategorization() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [destinations, setDestinations] = useState<{
    opportunities: Note[];
    needs: Note[];
    problems: Note[];
  }>({
    opportunities: [],
    needs: [],
    problems: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch('/api/modules/2/forms');
        if (!res.ok) throw new Error('Failed to fetch forms');

        const data: { forms: FormResponse[] } = await res.json();

        console.log('API response:', data);

        const colorPairs: [string, string][] = [
          ['bg-pink-100', 'bg-pink-500'],
          ['bg-green-100', 'bg-green-500'],
          ['bg-yellow-100', 'bg-yellow-500'],
          ['bg-blue-100', 'bg-blue-500'],
          ['bg-purple-100', 'bg-purple-500'],
          ['bg-orange-100', 'bg-orange-500'],
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
        console.error('Error fetching forms', err);
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

    if (source.droppableId.startsWith('category-')) {
      const categoryId = source.droppableId.split('-')[1];
      const sourceCategory = categories.find((c) => c.id === categoryId);
      if (!sourceCategory) return;

      const draggedNote = sourceCategory.notes[source.index];

      const newCategories = categories.map((c) =>
        c.id === categoryId
          ? { ...c, notes: c.notes.filter((n) => n.id !== draggedNote.id) }
          : c
      );

      const newDestinations = { ...destinations };
      const key = destination.droppableId as keyof typeof destinations;
      const updatedList = [...newDestinations[key]];
      updatedList.splice(destination.index, 0, draggedNote);
      newDestinations[key] = updatedList;

      setCategories(newCategories);
      setDestinations(newDestinations);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading data...</p>;

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Zoom <span className="text-blue-600">out:</span> categorization
      </h1>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <div key={category.id} className={`${category.color} rounded-xl p-4 shadow-md flex flex-col`}>
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

          <div className="flex flex-col gap-6">
            {(['opportunities', 'needs', 'problems'] as const).map((key) => (
              <div key={key}>
                <h3 className="text-lg font-bold uppercase mb-2 text-gray-800">{key}</h3>
                <Droppable droppableId={key}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[100px] bg-white rounded-lg shadow-md p-3 flex flex-wrap gap-2"
                    >
                      {destinations[key].map((note, index) => (
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
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
