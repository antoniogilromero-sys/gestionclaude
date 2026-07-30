import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "./AppHeader";
import { NavBar } from "./NavBar";

export async function AppShell({
  nombre,
  rol,
  children,
}: {
  nombre: string;
  rol: "director" | "entrenador" | "pendiente";
  children: React.ReactNode;
}) {
  // Cuántas altas esperan aprobación. Sin esto, un entrenador puede
  // registrarse y quedarse esperando días sin que el director se entere.
  let pendientes = 0;
  if (rol === "director") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("perfiles")
      .select("id", { count: "exact", head: true })
      .eq("rol", "pendiente");
    pendientes = count ?? 0;
  }

  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={nombre} rol={rol} />
      <NavBar rol={rol} pendientes={pendientes} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px] flex-1">{children}</main>
    </div>
  );
}
