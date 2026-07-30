import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

const TAG_DISC: Record<string, string> = {
  natacion: "bg-swim/15 text-swim",
  ciclismo: "bg-bike/15 text-bike",
  carrera: "bg-run/15 text-run",
};

export default async function EntrenamientosPage() {
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
  if (!perfil || perfil.rol === "pendiente") redirect("/");

  const esDirector = perfil.rol === "director";

  let query = supabase
    .from("sesiones")
    .select(
      "id, fecha, titulo, disciplina, material, publicada, sesion_grupo(grupos(nombre)), sesion_vista(entrenador_id, perfiles(nombre))",
    )
    .order("fecha", { ascending: false });

  if (!esDirector) query = query.eq("publicada", true);

  const { data: sesiones } = await query;

  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={perfil.nombre} rol={perfil.rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
            Entrenamientos
          </h2>
          {esDirector && (
            <Link
              href="/publicar"
              className="font-display text-xs tracking-[.08em] uppercase text-signal"
            >
              + Publicar
            </Link>
          )}
        </div>
        {(!sesiones || sesiones.length === 0) && (
          <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
            <b className="block text-chalk text-base mb-[5px] font-medium">
              Todavía no hay nada
            </b>
            Cuando la dirección técnica publique el entrenamiento de la
            semana, aparecerá aquí.
          </div>
        )}
        {(sesiones ?? []).map((s) => {
          const grupos = (
            (s.sesion_grupo as unknown as { grupos: { nombre: string } | null }[]) ?? []
          )
            .map((sg) => sg.grupos?.nombre)
            .filter(Boolean);
          const vistoPor = (
            (s.sesion_vista as unknown as { perfiles: { nombre: string } | null }[]) ?? []
          )
            .map((v) => v.perfiles?.nombre)
            .filter(Boolean);
          return (
            <Link
              key={s.id}
              href={`/entrenamientos/${s.id}`}
              className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span
                  className={`font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] ${TAG_DISC[s.disciplina ?? ""] ?? "bg-edge text-chalk"}`}
                >
                  {s.disciplina}
                </span>
                <span className="font-display text-sm">
                  {s.fecha.split("-").reverse().slice(0, 2).join("/")}
                </span>
                <span className="text-mute text-sm">· {grupos.join(" · ")}</span>
                {esDirector && !s.publicada && (
                  <span className="font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] bg-signal text-[#160800]">
                    borrador
                  </span>
                )}
              </div>
              <h3 className="text-[16px] font-semibold">{s.titulo}</h3>
              {s.material && (
                <div className="text-xs text-mute mt-1">material: {s.material}</div>
              )}
              {esDirector && (
                <div className="text-xs text-mute mt-1.5 pt-1.5 border-t border-edge">
                  {vistoPor.length > 0
                    ? `Visto por: ${vistoPor.join(", ")}`
                    : "Nadie lo ha abierto todavía"}
                </div>
              )}
            </Link>
          );
        })}
      </main>
    </div>
  );
}
