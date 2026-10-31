"use server";

import { createClient } from "@/lib/supabase/server";

type Resultado = { error: string } | { ok: true };
type DirectorCheck =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string };

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción.
async function requireDirector(): Promise<DirectorCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol !== "director") {
    return { ok: false, error: "Solo el director puede hacer esto" };
  }
  return { ok: true, supabase };
}

// Crea la prueba con dos equipos ya hechos (lo habitual); más se añaden luego.
export async function crearPrueba(input: {
  nombre: string;
  fecha: string;
  lugar: string;
}): Promise<{ error: string } | { ok: true; id: number }> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const nombre = input.nombre.trim();
  if (!nombre) return { error: "Falta el nombre de la prueba" };

  const { data: prueba, error } = await r.supabase
    .from("pruebas_equipos")
    .insert({ nombre, fecha: input.fecha || null, lugar: input.lugar.trim() || null })
    .select("id")
    .single();
  if (error || !prueba) return { error: error?.message ?? "No se ha podido crear la prueba" };

  const { error: errorEquipos } = await r.supabase.from("prueba_equipo").insert([
    { prueba_id: prueba.id, nombre: "Equipo 1", orden: 1 },
    { prueba_id: prueba.id, nombre: "Equipo 2", orden: 2 },
  ]);
  if (errorEquipos) {
    // Que no quede una prueba a medias sin equipos.
    await r.supabase.from("pruebas_equipos").delete().eq("id", prueba.id);
    return { error: errorEquipos.message };
  }
  return { ok: true, id: prueba.id };
}

export async function borrarPrueba(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("pruebas_equipos").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function crearEquipo(pruebaId: number, nombre: string): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const limpio = nombre.trim();
  if (!limpio) return { error: "Falta el nombre del equipo" };
  const { data: ultimo } = await r.supabase
    .from("prueba_equipo")
    .select("orden")
    .eq("prueba_id", pruebaId)
    .order("orden", { ascending: false })
    .limit(1);
  const orden = (ultimo?.[0]?.orden ?? 0) + 1;
  const { error } = await r.supabase
    .from("prueba_equipo")
    .insert({ prueba_id: pruebaId, nombre: limpio, orden });
  if (error) return { error: error.message };
  return { ok: true };
}

// Pone (o quita, con null) el tiempo de 200 m escrito a mano de un nadador.
export async function ponerTiempoMiembro(id: number, segundos: number | null): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  if (segundos != null && !(segundos > 0 && segundos < 3600)) {
    return { error: "El tiempo no es válido" };
  }
  const { error } = await r.supabase
    .from("prueba_equipo_miembro")
    .update({ tiempo_s: segundos })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function anadirMiembro(
  equipoId: number,
  deportistaId: number | null,
  nombre: string,
  club?: string,
): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const limpio = nombre.trim();
  if (!limpio) return { error: "Falta el nombre" };
  const { data: ultimo } = await r.supabase
    .from("prueba_equipo_miembro")
    .select("orden")
    .eq("equipo_id", equipoId)
    .order("orden", { ascending: false })
    .limit(1);
  const orden = (ultimo?.[0]?.orden ?? 0) + 1;
  const { error } = await r.supabase
    .from("prueba_equipo_miembro")
    .insert({
      equipo_id: equipoId,
      deportista_id: deportistaId,
      nombre: limpio,
      orden,
      club: club?.trim() || null,
    });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function quitarMiembro(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("prueba_equipo_miembro").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function moverMiembro(id: number, equipoId: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { data: ultimo } = await r.supabase
    .from("prueba_equipo_miembro")
    .select("orden")
    .eq("equipo_id", equipoId)
    .order("orden", { ascending: false })
    .limit(1);
  const orden = (ultimo?.[0]?.orden ?? 0) + 1;
  const { error } = await r.supabase
    .from("prueba_equipo_miembro")
    .update({ equipo_id: equipoId, orden })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
