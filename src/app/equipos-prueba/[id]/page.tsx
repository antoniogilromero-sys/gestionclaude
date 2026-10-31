import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { EquiposEditor } from "./EquiposEditor";

export default async function PruebaEquiposPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pruebaId = Number(id);
  if (!pruebaId) notFound();

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
  if (!perfil || perfil.rol !== "director") redirect("/");

  const { data: prueba } = await supabase
    .from("pruebas_equipos")
    .select("id, nombre, fecha, lugar")
    .eq("id", pruebaId)
    .maybeSingle();
  if (!prueba) notFound();

  const [{ data: equipos }, { data: deportistas }, { data: tipo }] = await Promise.all([
    supabase
      .from("prueba_equipo")
      .select("id, nombre, orden, prueba_equipo_miembro(id, deportista_id, nombre, orden)")
      .eq("prueba_id", pruebaId)
      .order("orden")
      .order("id"),
    supabase.from("deportistas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("tipos_test").select("id").eq("nombre", "200 m natacion").maybeSingle(),
  ]);

  type EquipoCrudo = {
    id: number;
    nombre: string;
    prueba_equipo_miembro: { id: number; deportista_id: number | null; nombre: string; orden: number }[];
  };
  const crudos = (equipos ?? []) as unknown as EquipoCrudo[];

  // Mejor 200 m de natación de cada deportista vinculado (el menor tiempo).
  const ids = [
    ...new Set(
      crudos.flatMap((e) =>
        e.prueba_equipo_miembro.map((m) => m.deportista_id).filter((x): x is number => x != null),
      ),
    ),
  ];
  const mejor = new Map<number, number>();
  if (tipo && ids.length > 0) {
    const { data: resultados } = await supabase
      .from("resultados")
      .select("deportista_id, tiempo_s")
      .eq("tipo_test_id", tipo.id)
      .in("deportista_id", ids)
      .not("tiempo_s", "is", null);
    for (const r of resultados ?? []) {
      const t = Number(r.tiempo_s);
      const actual = mejor.get(r.deportista_id);
      if (actual === undefined || t < actual) mejor.set(r.deportista_id, t);
    }
  }

  const equiposListos = crudos.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    miembros: [...e.prueba_equipo_miembro]
      .sort((a, b) => a.orden - b.orden || a.id - b.id)
      .map((m) => ({
        id: m.id,
        deportistaId: m.deportista_id,
        nombre: m.nombre,
        tiempo: m.deportista_id != null ? (mejor.get(m.deportista_id) ?? null) : null,
      })),
  }));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <Link href="/equipos-prueba" className="text-xs text-mute underline mb-2 inline-block">
        ← Equipos de prueba
      </Link>
      <h2 className="text-[18px] font-semibold">{prueba.nombre}</h2>
      <p className="text-xs text-mute mb-3.5">
        {prueba.fecha ? prueba.fecha.split("-").reverse().join("/") + " · " : ""}
        {prueba.lugar ?? ""}
      </p>
      <EquiposEditor
        pruebaId={prueba.id}
        equipos={equiposListos}
        deportistas={deportistas ?? []}
      />
    </AppShell>
  );
}
