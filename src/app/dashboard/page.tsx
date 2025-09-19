import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  //const session = await getServerSession();

    // Simulamos que ya hay una sesión activa
  const session = {
    user: {
      name: "Usuario Demo 2",
      email: "demo@example.com",
    },
  };

  if (!session) {
    // Redirige a login si no hay sesión
    redirect("/auth/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Bienvenido, {session.user?.name}</p>
    </div>
  );
}