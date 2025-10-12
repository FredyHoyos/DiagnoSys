"use client";

import React from 'react'
import Button from "@/app/components/atoms/button";
import { signOut } from "next-auth/react";

const index = ({title="Title", description="Description", upText="text", categorieNumber=0, itemNumber=0}) => {
  return (
            <div className='flex flex-row space-x-3 rounded-lg border border-gray-300 p-4 shadow-sm w-96 items-center'>
            <div className='flex-1'>
                <div className='mb-2 flex flex-row justify-between items-center'>
                    <h1 className='text-3xl font-bold'>{title}</h1>
                    <h2 className='text-xl font-semibold bg-green-200 rounded-md flex items-center justify-center p-1 text-green-700 h-7'>{upText}</h2>
                </div>
                <p className='text-gray-600'>{description}</p>
                <p className='text-gray-600'>{categorieNumber} categorías • {itemNumber} ítems</p>
                <div>
                    <Button label="Edit" onClick={() => signOut({ callbackUrl: "/auth/card" })} />
                    <button className='mt-4 ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer'>Preview</button>
                </div>
            </div>
        </div>  
  )
}

export default index
