import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .single();

  const nombre = perfil?.nombre ?? user.email ?? "—";
  const rol = perfil?.rol ?? "pendiente";

  return (
    <AppShell nombre={nombre} rol={rol}>
      {rol === "pendiente" ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">
            A la espera de aprobación
          </b>
          El director técnico tiene que aprobar tu alta antes de que veas
          deportistas, grupos o entrenamientos.
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-chalk/90">
          Hola, {nombre.split(" ")[0]}. Usa la barra de arriba para moverte
          entre pantallas.
        </p>
      )}
    </AppShell>
  );
}
