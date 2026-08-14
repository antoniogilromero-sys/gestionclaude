import { createAdminClient } from "@/lib/supabase/admin";

// Enlace público, sin login (como /horario-publico): cada deportista lo
// abre una vez para conectar su Strava. No usa la sesión del navegador
// para nada — por eso lee con la clave de servicio, pidiendo solo el
// nombre de ese deportista concreto, nada más de su ficha.

const SITE_URL = "https://triatlonalpedrete.vercel.app";

export default async function StravaConectarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error: errorQuery } = await searchParams;
  const deportistaId = Number(id);

  if (!deportistaId) {
    return <Mensaje titulo="Enlace no válido" texto="Revisa el enlace que te han pasado." />;
  }

  const supabase = createAdminClient();
  const [{ data: deportista }, { data: conexion }] = await Promise.all([
    supabase.from("deportistas").select("nombre").eq("id", deportistaId).maybeSingle(),
    supabase
      .from("strava_conexiones")
      .select("deportista_id")
      .eq("deportista_id", deportistaId)
      .maybeSingle(),
  ]);

  if (!deportista) {
    return (
      <Mensaje titulo="Enlace no válido" texto="No se encuentra a ese deportista. Revisa el enlace." />
    );
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${SITE_URL}/api/strava/callback`;
  const authorizeUrl =
    `https://www.strava.com/oauth/authorize?client_id=${clientId}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&approval_prompt=force&scope=activity:read&state=${deportistaId}`;

  const yaConectado = ok === "1" || Boolean(conexion);

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center px-5">
      <div className="max-w-[420px] w-full bg-surf border border-edge rounded-[14px] p-6 text-center">
        <h1 className="font-display text-[13px] tracking-[.16em] uppercase text-mute mb-1">
          C.D.E. Triatlón Alpedrete
        </h1>
        <h2 className="text-[20px] font-semibold mb-4">{deportista.nombre}</h2>

        {yaConectado ? (
          <div className="bg-ok/10 border border-ok/40 rounded-[10px] p-4">
            <b className="block text-ok text-base mb-1">✅ Strava conectado</b>
            <p className="text-sm text-mute leading-relaxed">
              Ya puedes cerrar esta pantalla. El club podrá ver tu resumen de
              entrenamientos (distancia, tiempo y tipo de actividad).
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-mute leading-relaxed mb-5">
              Conecta tu cuenta de Strava para que el club pueda ver tu volumen
              de entrenamiento — solo distancia, tiempo y tipo de actividad,
              nada más de tu cuenta.
            </p>
            {errorQuery === "1" && (
              <p className="text-run text-sm mb-3">
                Algo ha fallado al conectar. Vuelve a intentarlo.
              </p>
            )}
            <a
              href={authorizeUrl}
              className="inline-block w-full bg-[#FC4C02] text-white rounded-[9px] py-3.5 font-display text-[15px] tracking-[.06em] uppercase font-semibold"
            >
              Conectar con Strava
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="min-h-screen bg-deep flex items-center justify-center px-5">
      <div className="max-w-[420px] w-full bg-surf border border-edge rounded-[14px] p-6 text-center">
        <b className="block text-run text-base mb-1">{titulo}</b>
        <p className="text-sm text-mute">{texto}</p>
      </div>
    </div>
  );
}
