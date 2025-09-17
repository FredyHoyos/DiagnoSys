"use client";

import { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        const data: User[] = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return (
    <main className="p-6 py-10 flex flex-col items-center gap-6 w-full">
      <h1 className="text-3xl font-bold text-pink-700 text-center">
        Test: DB connection validation
      </h1>

      <section className="w-full max-w-3xl">
        <h2 className="text-xl font-semibold mb-6">Registered Users</h2>

        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="p-4 border rounded shadow bg-white animate-pulse space-y-3"
              >
                <div className="h-4 w-1/4 bg-gray-300 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-300 rounded"></div>
                <div className="h-4 w-1/3 bg-gray-300 rounded"></div>
                <div className="h-4 w-1/3 bg-gray-300 rounded"></div>
                <div className="h-4 w-1/3 bg-gray-300 rounded"></div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-4">
            {users.map((u) => (
              <li
                key={u.id}
                className="p-4 border rounded shadow bg-white hover:shadow-md transition"
              >
                <p><strong>ID:</strong> {u.id}</p>
                <p><strong>Name:</strong> {u.name}</p>
                <p><strong>Email:</strong> {u.email}</p>
                <p><strong>Created:</strong> {new Date(u.createdAt).toLocaleString()}</p>
                <p><strong>Updated:</strong> {new Date(u.updatedAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
