"use server";

import { createClient } from "@/lib/supabase/server";

type Resultado = { error: string } | { ok: true };
type DirectorCheck =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string };

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción.
async function requireDirector(): Promise<DirectorCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || perfil.rol !== "director") {
    return { ok: false, error: "Solo el director puede hacer esto" };
  }
  return { ok: true, supabase, userId: user.id };
}

// El archivo (si lo hay) ya lo ha subido el navegador al almacén "duatlon";
// aquí solo se guarda la entrada. (Subirlo por aquí chocaría con el límite de
// tamaño de las funciones de Vercel.)
export async function crearItem(input: {
  categoria: string;
  titulo: string;
  nota: string;
  enlace: string;
  esTarea: boolean;
  archivoRuta: string | null;
  archivoNombre: string | null;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const titulo = input.titulo.trim();
  if (!titulo) return { error: "Falta el título" };
  let enlace = input.enlace.trim();
  if (enlace && !/^https?:\/\//i.test(enlace)) enlace = `https://${enlace}`;

  const { error } = await r.supabase.from("duatlon_items").insert({
    categoria: input.categoria,
    titulo,
    nota: input.nota.trim() || null,
    enlace: enlace || null,
    es_tarea: input.esTarea,
    archivo_ruta: input.archivoRuta,
    archivo_nombre: input.archivoNombre,
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function marcarHecho(id: number, hecho: boolean): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("duatlon_items").update({ hecho }).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarItem(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { data: item } = await r.supabase
    .from("duatlon_items")
    .select("archivo_ruta")
    .eq("id", id)
    .maybeSingle();
  const { error } = await r.supabase.from("duatlon_items").delete().eq("id", id);
  if (error) return { error: error.message };
  // El archivo se borra después: si fallara, queda un archivo suelto pero no
  // una entrada que apunte a algo que no existe.
  if (item?.archivo_ruta) await r.supabase.storage.from("duatlon").remove([item.archivo_ruta]);
  return { ok: true };
}
