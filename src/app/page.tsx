import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

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
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={nombre} rol={rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        {rol === "pendiente" ? (
          <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
            <b className="block text-chalk text-base mb-[5px] font-medium">
              A la espera de aprobación
            </b>
            El director técnico tiene que aprobar tu alta antes de que veas
            deportistas, grupos o entrenamientos.
          </div>
        ) : rol === "director" ? (
          <div className="flex flex-col gap-2.5">
            <Link
              href="/reparto"
              className="block text-center w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold"
            >
              Reparto semanal
            </Link>
            <Link
              href="/publicar"
              className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase"
            >
              Publicar
            </Link>
            <Link
              href="/entrenamientos"
              className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase"
            >
              Entrenamientos
            </Link>
            <Link
              href="/resultados"
              className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase"
            >
              Resultados
            </Link>
            <Link
              href="/analisis"
              className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase"
            >
              Análisis
            </Link>
            <Link
              href="/equipo"
              className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase"
            >
              Equipo
            </Link>
            <Link
              href="/deportistas"
              className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase"
            >
              Deportistas
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <Link
              href="/entrenamientos"
              className="block text-center w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold"
            >
              Entrenamientos
            </Link>
            <Link
              href="/tests"
              className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase"
            >
              Registrar test
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
