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
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
