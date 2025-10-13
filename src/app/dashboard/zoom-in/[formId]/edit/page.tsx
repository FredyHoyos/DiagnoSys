"use client";
import React, { useState, useEffect } from "react";
import FormHeader from "../components/FormHeader";
import CategoryEditor from "../components/CategoryEditor";

type Item = {
  id: number;
  name: string;
  description?: string;
};

type Category = {
  id: number;
  name: string;
  description?: string;
  items: Item[];
};

type FormResponse = {
  id: number;
  name: string;
  description?: string;
  categories: Category[];
};

type CategoryState = {
  name: string;
  description: string;
  items: string[];
};

export default function EditFormPage({
  params,
}: {
  params: { formId: string };
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<CategoryState[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/forms/${params.formId}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.form) {
        setTitle(data.form.name);
        setDescription(data.form.description || "");

        setCategories(
          (data.form.categories as Category[]).map((c) => ({
            name: c.name,
            description: c.description || "",
            items: c.items.map((i) => i.name),
          }))
        );
      }
    };
    fetchData();
  }, [params.formId]);

  const handleSave = async () => {
    await fetch(`/api/forms/${params.formId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, categories }),
    });
    alert("Form updated successfully");
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <FormHeader
        title={title}
        description={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
      />

      <CategoryEditor
        categories={categories}
        onAddCategory={() =>
          setCategories([...categories, { name: "", description: "", items: [] }])
        }
        onDeleteCategory={(index) =>
          setCategories(categories.filter((_, i) => i !== index))
        }
        onCategoryChange={(index, field, value) => {
          setCategories((prev) =>
            prev.map((cat, i) =>
              i === index ? { ...cat, [field]: value } : cat
            )
          );
        }}
        onItemChange={(index, items) => {
          const updated = [...categories];
          updated[index].items = items;
          setCategories(updated);
        }}
      />

      <div className="flex justify-end gap-4 mt-10">
        <button className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
