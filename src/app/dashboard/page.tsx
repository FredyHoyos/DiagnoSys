"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/users").then(res => res.json()).then(setUsers);
  }, []);

  const addUser = async () => {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nuevo", email: `user${Date.now()}@mail.com` }),
    });
    const updated = await fetch("/api/users").then(res => res.json());
    setUsers(updated);
  };

  return (
    <main className="p-6">
        <h1 className="text-2xl font-bold text-pink-700">Prueba para validar la conexion a db</h1>
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <button onClick={addUser} className="px-4 py-2 bg-blue-500 text-white rounded">
        ➕ Agregar Usuario
      </button>
      <ul className="mt-4">
        {users.map(u => (
          <li key={u.id}>{u.name} - {u.email}</li>
        ))}
      </ul>
    </main>
  );
}
