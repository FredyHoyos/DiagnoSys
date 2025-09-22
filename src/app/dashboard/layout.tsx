"use client";

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar fijo */}
        <Sidebar />

        {/* Contenido con scroll */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
