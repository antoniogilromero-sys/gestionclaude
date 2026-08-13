import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function AdministracionPage() {
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

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Gestiones administrativas
      </h2>
      <Link
        href="/facturas"
        className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
      >
        <b className="block text-[16px] font-semibold mb-[3px]">Facturas</b>
        <span className="text-sm text-mute">
          Emitir facturas exentas de IVA con numeración correlativa.
        </span>
      </Link>
      <Link
        href="/pedidos"
        className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
      >
        <b className="block text-[16px] font-semibold mb-[3px]">Pedidos</b>
        <span className="text-sm text-mute">
          Pedidos de camisetas y sudaderas: quién lo pide, talla y cantidad.
        </span>
      </Link>
      <Link
        href="/jornadas"
        className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
      >
        <b className="block text-[16px] font-semibold mb-[3px]">Jornadas en colegios</b>
        <span className="text-sm text-mute">
          Talleres de promoción (duatlón, acuatlón...): colegio, fecha y
          entrenadores asignados.
        </span>
      </Link>
      <Link
        href="/pagos"
        className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
      >
        <b className="block text-[16px] font-semibold mb-[3px]">Pagos a entrenadores</b>
        <span className="text-sm text-mute">
          Cierre semanal y mensual del coste de cada entrenador, según el
          reparto y las tarifas.
        </span>
      </Link>
      <Link
        href="/horarios"
        className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
      >
        <b className="block text-[16px] font-semibold mb-[3px]">Horarios de entrenamientos</b>
        <span className="text-sm text-mute">
          Horario de consulta de Adultos y Escuela: día, disciplina, hora y
          lugar.
        </span>
      </Link>
      <Link
        href="/inscripciones"
        className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
      >
        <b className="block text-[16px] font-semibold mb-[3px]">Inscripciones</b>
        <span className="text-sm text-mute">
          Datos personales del alta de socios (Google Forms). Visible solo
          para ti.
        </span>
      </Link>
      <Link
        href="/prevision-entrenadores"
        className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
      >
        <b className="block text-[16px] font-semibold mb-[3px]">Previsión de entrenadores</b>
        <span className="text-sm text-mute">
          Tu plantilla orientativa de quién suele cubrir cada franja. Visible
          solo para ti.
        </span>
      </Link>
      <p className="text-xs text-mute leading-relaxed mt-4 pt-3 border-t border-edge">
        Este apartado irá creciendo con más gestiones administrativas del
        club (campamentos...) según haga falta.
      </p>
    </AppShell>
  );
}
