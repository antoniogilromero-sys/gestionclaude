import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { MarcarVisto } from "../MarcarVisto";

const TAG_DISC: Record<string, string> = {
  natacion: "bg-swim/15 text-swim",
  ciclismo: "bg-bike/15 text-bike",
  carrera: "bg-run/15 text-run",
};

export default async function EntrenamientoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: sesion } = await supabase
    .from("sesiones")
    .select(
      "id, fecha, titulo, disciplina, contenido, material, sesion_grupo(grupos(nombre))",
    )
    .eq("id", id)
    .single();

  if (!sesion) notFound();

  const grupos = (
    (sesion.sesion_grupo as unknown as { grupos: { nombre: string } | null }[]) ?? []
  )
    .map((sg) => sg.grupos?.nombre)
    .filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={perfil.nombre} rol={perfil.rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <MarcarVisto sesionId={sesion.id} />
        <Link href="/entrenamientos" className="text-mute text-sm">
          ← Entrenamientos
        </Link>
        <article className="bg-surf border border-edge rounded-[10px] p-3.5 mt-2.5">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] ${TAG_DISC[sesion.disciplina ?? ""] ?? "bg-edge text-chalk"}`}
            >
              {sesion.disciplina}
            </span>
            <span className="font-display text-sm">
              {sesion.fecha.split("-").reverse().slice(0, 2).join("/")}
            </span>
            <span className="text-mute text-sm">· {grupos.join(" · ")}</span>
          </div>
          <h3 className="text-[16px] font-semibold">{sesion.titulo}</h3>
          {sesion.material && (
            <div className="text-xs text-mute mt-1">material: {sesion.material}</div>
          )}
          <div className="whitespace-pre-wrap text-sm leading-relaxed mt-2.5 pt-2.5 border-t border-edge text-[#CFE3E8]">
            {sesion.contenido}
          </div>
        </article>
      </main>
    </div>
  );
}
