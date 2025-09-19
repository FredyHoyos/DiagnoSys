"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BarChartIcon,
  PersonIcon,
  GearIcon,
  Link2Icon,
  HamburgerMenuIcon,
  Cross1Icon,
} from "@radix-ui/react-icons";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); //Detecta la ruta actual

  const links = [
    { href: "/dashboard", label: "Inicio", icon: <HomeIcon /> },
    { href: "/dashboard/efficiency", label: "Informes", icon: <BarChartIcon /> },
    { href: "/dashboard/users", label: "Empresas", icon: <PersonIcon /> },
    { href: "/dashboard/references", label: "Consultores", icon: <Link2Icon /> },
    { href: "/dashboard/settings", label: "Configuración", icon: <GearIcon /> },
  ];

  return (
    <>
      {/* Botón hamburguesa visible solo en móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <Cross1Icon className="w-6 h-6" /> : <HamburgerMenuIcon className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 max-h-full w-64 bg-white shadow-lg p-4 z-40 pt-16
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static md:block
        `}
      >
        <h2 className="text-2xl font-bold text-orange-500 mb-6">Herramientas</h2>
        <nav className="flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-2 py-1 rounded transition ${
                pathname === link.href
                  ? "text-white bg-primary font-semibold"
                  : "hover:text-blue-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Fondo oscuro al abrir en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
