import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { toISODateLocal, lunesDe } from "@/lib/date";

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

  if (rol === "pendiente") {
    return (
      <AppShell nombre={nombre} rol={rol}>
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">
            A la espera de aprobación
          </b>
          El director técnico tiene que aprobar tu alta antes de que veas
          deportistas, grupos o entrenamientos. Avísale de que ya has entrado;
          en cuanto te apruebe, solo tienes que recargar esta página.
        </div>
      </AppShell>
    );
  }

  const semana = toISODateLocal(lunesDe(new Date()));

  return (
    <AppShell nombre={nombre} rol={rol}>
      {rol === "director" ? (
        <ResumenDirector semana={semana} />
      ) : (
        <ResumenEntrenador userId={user.id} semana={semana} />
      )}
    </AppShell>
  );
}

async function ResumenDirector({ semana }: { semana: string }) {
  const supabase = await createClient();

  const [
    { data: grupos },
    { data: asignaciones },
    { count: sinGrupo },
    { count: marcasSemana },
    { data: ultimaSesion },
  ] = await Promise.all([
    supabase.from("grupos").select("id, nombre").eq("activo", true),
    supabase.from("asignaciones").select("grupo_id").eq("semana", semana),
    supabase
      .from("deportistas")
      .select("id", { count: "exact", head: true })
      .eq("activo", true)
      .is("grupo_id", null),
    supabase
      .from("resultados")
      .select("id", { count: "exact", head: true })
      .gte("fecha", semana),
    supabase
      .from("sesiones")
      .select("id, titulo, fecha")
      .eq("publicada", true)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const conEntrenador = new Set((asignaciones ?? []).map((a) => a.grupo_id));
  const gruposSinEntrenador = (grupos ?? []).filter((g) => !conEntrenador.has(g.id));

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Esta semana
      </h2>

      {gruposSinEntrenador.length > 0 ? (
        <Aviso
          tono="alerta"
          titulo={`${gruposSinEntrenador.length} ${gruposSinEntrenador.length === 1 ? "grupo se queda" : "grupos se quedan"} sin entrenador`}
          href="/reparto"
          accion="Ir al reparto"
        >
          {gruposSinEntrenador
            .slice(0, 4)
            .map((g) => g.nombre)
            .join(", ")}
          {gruposSinEntrenador.length > 4 && ` y ${gruposSinEntrenador.length - 4} más`}
        </Aviso>
      ) : (
        <Aviso tono="ok" titulo="Todos los grupos tienen entrenador" href="/reparto" accion="Ver el reparto">
          El reparto de esta semana está completo.
        </Aviso>
      )}

      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <Tarjeta valor={marcasSemana ?? 0} etiqueta="MARCAS ESTA SEMANA" href="/resultados" />
        <Tarjeta valor={sinGrupo ?? 0} etiqueta="SIN GRUPO ASIGNADO" href="/deportistas" />
      </div>

      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mt-5 mb-2.5">
        Último entrenamiento publicado
      </h2>
      {ultimaSesion ? (
        <Link
          href={`/entrenamientos/${ultimaSesion.id}`}
          className="block bg-surf border border-edge rounded-[10px] p-3.5"
        >
          <span className="font-display text-sm text-mute">
            {ultimaSesion.fecha.split("-").reverse().slice(0, 2).join("/")}
          </span>
          <b className="block text-[16px] font-semibold mt-0.5">{ultimaSesion.titulo}</b>
        </Link>
      ) : (
        <Link
          href="/publicar"
          className="block bg-surf border border-edge rounded-[10px] p-3.5 text-sm text-mute"
        >
          Todavía no has publicado ninguno.{" "}
          <span className="text-signal underline">Publicar el primero</span>
        </Link>
      )}
    </div>
  );
}

async function ResumenEntrenador({ userId, semana }: { userId: string; semana: string }) {
  const supabase = await createClient();

  const [{ data: misAsignaciones }, { data: grupos }, { data: ultimaSesion }] =
    await Promise.all([
      supabase
        .from("asignaciones")
        .select("grupo_id")
        .eq("entrenador_id", userId)
        .eq("semana", semana),
      supabase.from("grupos").select("id, nombre"),
      supabase
        .from("sesiones")
        .select("id, titulo, fecha")
        .eq("publicada", true)
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const misIds = new Set((misAsignaciones ?? []).map((a) => a.grupo_id));
  const misGrupos = (grupos ?? []).filter((g) => misIds.has(g.id));

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Tus grupos esta semana
      </h2>
      {misGrupos.length > 0 ? (
        <div className="flex flex-wrap gap-[7px] mb-4">
          {misGrupos.map((g) => (
            <span
              key={g.id}
              className="min-h-[44px] px-4 grid place-items-center rounded-full border border-signal bg-signal text-[#160800] text-[14px] font-semibold"
            >
              {g.nombre}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-mute leading-relaxed mb-4">
          El director técnico todavía no te ha asignado ningún grupo para esta
          semana. Puedes registrar marcas igualmente si cubres a un compañero.
        </p>
      )}

      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Último entrenamiento
      </h2>
      {ultimaSesion ? (
        <Link
          href={`/entrenamientos/${ultimaSesion.id}`}
          className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-3"
        >
          <span className="font-display text-sm text-mute">
            {ultimaSesion.fecha.split("-").reverse().slice(0, 2).join("/")}
          </span>
          <b className="block text-[16px] font-semibold mt-0.5">{ultimaSesion.titulo}</b>
        </Link>
      ) : (
        <p className="text-sm text-mute mb-3">
          Todavía no hay ningún entrenamiento publicado.
        </p>
      )}

      <Link
        href="/tests"
        className="block text-center w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold"
      >
        Registrar test
      </Link>
    </div>
  );
}

function Aviso({
  tono,
  titulo,
  children,
  href,
  accion,
}: {
  tono: "alerta" | "ok";
  titulo: string;
  children: React.ReactNode;
  href: string;
  accion: string;
}) {
  return (
    <div
      className={`bg-surf border rounded-[10px] p-3.5 ${
        tono === "alerta" ? "border-run/40" : "border-ok/40"
      }`}
    >
      <b className={`block text-[15px] font-medium mb-1 ${tono === "alerta" ? "text-run" : "text-ok"}`}>
        {titulo}
      </b>
      <p className="text-sm text-mute leading-relaxed">{children}</p>
      <Link href={href} className="inline-block text-signal text-sm underline mt-2">
        {accion}
      </Link>
    </div>
  );
}

function Tarjeta({ valor, etiqueta, href }: { valor: number; etiqueta: string; href: string }) {
  return (
    <Link href={href} className="block bg-surf border border-edge rounded-[10px] p-[11px]">
      <b className="font-display text-[26px] block leading-none">{valor}</b>
      <span className="text-[11px] text-mute tracking-[.04em]">{etiqueta}</span>
    </Link>
  );
}
