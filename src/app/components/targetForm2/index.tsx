"use client";

import React from "react";
import Button from "@/app/components/atoms/button";
import { useRouter } from "next/navigation"; 

const TargetFormCard = ({
  title = "Title",
  description = "Description",
  publicF = false,
  categorieNumber = 0,
  itemNumber = 0,
  formId = "",
}) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/dashboard/admin/zoom-in/${formId}/edit`);
  };

  return (
    <div className="flex flex-row space-x-3 rounded-lg border border-gray-300 p-4 shadow-sm w-80 items-center">
      <div className="flex-1">
        <div className="mb-2 flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          <h2
            className={`text-xs rounded-md flex items-center justify-center p-1 h-7 ${
              publicF
                ? "bg-green-200 text-green-700"
                : "bg-red-200 text-red-700"
            }`}
          >
            {publicF ? "Public" : "Private"}
          </h2>
        </div>

        <div className="space-y-2">
          <p className="text-gray-600">{description}</p>
          <p className="text-gray-600">
            {categorieNumber} Categories • {itemNumber} ítems
          </p>
        </div>

        <div>
          <Button label="Edit" onClick={handleEdit} />
          <button className="mt-4 ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer">
            Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetFormCard;
