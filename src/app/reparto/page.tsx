import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { toISODateLocal, parseLocalDate, lunesDe } from "@/lib/date";
import { RepartoGrid } from "./RepartoGrid";

export default async function RepartoPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
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

  const params = await searchParams;
  const base = params.semana ? parseLocalDate(params.semana) : new Date();
  const semanaDate = lunesDe(base);
  const semana = toISODateLocal(semanaDate);

  const anteriorDate = new Date(semanaDate);
  anteriorDate.setDate(semanaDate.getDate() - 7);
  const siguienteDate = new Date(semanaDate);
  siguienteDate.setDate(semanaDate.getDate() + 7);

  // El coste semanal (sueldos) y el cuadro de personal (email/teléfono) son
  // datos solo para el director — a un entrenador no le hace falta ver lo
  // que cobra el resto del equipo ni sus contactos, así que ni se piden si
  // no es director.
  const [{ data: grupos }, { data: entrenadores }, { data: asignaciones }] = await Promise.all([
    supabase
      .from("grupos")
      .select("id, nombre, disciplina, dias, hora_inicio, hora_fin")
      .eq("activo", true)
      .order("id"),
    supabase
      .from("perfiles")
      .select("id, nombre")
      .in("rol", ["director", "entrenador"])
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("asignaciones")
      .select("grupo_id, entrenador_id")
      .eq("semana", semana),
  ]);

  let tarifas: { entrenador_id: string; disciplina: string; euros_hora: number }[] = [];
  let personalTemporada: { nombre: string; email: string; telefono: string | null }[] = [];
  let personalError: string | null = null;
  let cuentasActivas: { email: string }[] = [];

  if (esDirector) {
    const [rTarifas, rPersonal, rCuentas] = await Promise.all([
      supabase.from("tarifas_entrenador").select("entrenador_id, disciplina, euros_hora"),
      supabase.from("personal_temporada").select("nombre, email, telefono").order("nombre"),
      // El director también puede ser uno de los entrenadores de la
      // plantilla (p. ej. Toni lleva grupos y además dirige el club), así
      // que el cuadro de personal cruza contra todos los roles activos, no
      // solo "entrenador" — si no, aparecería como "sin cuenta" siendo él
      // mismo. Se cruza por email, más fiable que el nombre (Google manda
      // el nombre completo, no el apodo que usa el club).
      supabase.from("perfiles").select("email").in("rol", ["director", "entrenador"]).eq("activo", true),
    ]);
    tarifas = rTarifas.data ?? [];
    personalTemporada = rPersonal.data ?? [];
    personalError = rPersonal.error?.message ?? null;
    cuentasActivas = rCuentas.data ?? [];
  }

  const emailsRegistrados = new Set(
    (cuentasActivas ?? []).map((c) => c.email.toLowerCase()),
  );
  const personal = (personalTemporada ?? []).map((p) => ({
    ...p,
    registrado: emailsRegistrados.has(p.email.toLowerCase()),
  }));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <RepartoGrid
        esDirector={esDirector}
        semana={semana}
        semanaAnterior={toISODateLocal(anteriorDate)}
        semanaSiguiente={toISODateLocal(siguienteDate)}
        grupos={grupos ?? []}
        entrenadores={entrenadores ?? []}
        asignacionesIniciales={asignaciones ?? []}
        tarifas={tarifas}
        personal={personal}
        personalError={personalError}
      />
    </AppShell>
  );
}
