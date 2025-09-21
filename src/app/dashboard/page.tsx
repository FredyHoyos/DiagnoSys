"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import styles from "./dashboard.module.css";

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
        const res = await fetch("/api/auth/users");
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
    <main className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Test: DB connection validation</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/card" })}
          className={styles.logoutButton}
        >
          Logout
        </button>
      </div>

      <section className={styles.section}>
        <h2>Registered Users</h2>

        {loading ? (
          <ul className={styles.list}>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className={styles.skeleton}>
                <div style={{ width: "25%" }}></div>
                <div style={{ width: "65%" }}></div>
                <div style={{ width: "40%" }}></div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.list}>
            {users.map((u) => (
              <li key={u.id} className={styles.card}>
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
