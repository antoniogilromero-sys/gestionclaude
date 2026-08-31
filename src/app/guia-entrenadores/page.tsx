import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

// Guía de la reunión de entrenadores (agosto 2026): qué puede ver y hacer
// un entrenador ya aprobado en cada sección de la app. El director la ve
// siempre; a los entrenadores solo se les abre durante la ventana de la
// reunión — pasado ese margen, se cierra sola sin que Antón tenga que
// acordarse de quitarla a mano.
//
// Horas en UTC porque España está en horario de verano (CEST, UTC+2) en
// septiembre: 1-sep 16:00 hora de España = 14:00 UTC.
const VENTANA_INICIO = new Date("2026-09-01T14:00:00Z");
const VENTANA_FIN = new Date("2026-09-02T14:00:00Z");

export default async function GuiaEntrenadoresPage() {
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

  const ahora = new Date();
  const dentroDeVentana = ahora >= VENTANA_INICIO && ahora < VENTANA_FIN;

  if (perfil.rol !== "director" && !dentroDeVentana) {
    return (
      <AppShell nombre={perfil.nombre} rol={perfil.rol}>
        <div className="bg-surf border border-edge rounded-[10px] p-4 text-center">
          <b className="block text-[15px] font-medium mb-1">No disponible</b>
          <p className="text-sm text-mute leading-relaxed">
            Esta guía solo se puede ver durante la reunión de entrenadores.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <span className="font-display text-[11px] tracking-[.16em] uppercase text-mute block mb-1">
        C.D.E. Triatlón Alpedrete
      </span>
      <h1 className="font-display text-2xl font-bold leading-tight mb-2 text-balance">
        Qué puede hacer un entrenador en la app
      </h1>
      <p className="text-sm text-mute leading-relaxed mb-5 max-w-[60ch]">
        Guía rápida para la reunión: qué ve, qué puede tocar y qué queda solo
        para dirección técnica cada entrenador ya aprobado. En el mismo orden
        en que aparece en su menú.
      </p>

      <div className="lane mb-5" />

      <Seccion n="01" titulo="Reparto">
        <p>
          El cuadro semanal completo: qué grupo entrena cada día y hora, y
          quién lo cubre — no solo el suyo, el de todo el club.
        </p>
        <Bloque label="Puede">
          <Item ok>Consultar la semana entera, moverse a semanas anteriores/siguientes.</Item>
          <Item ok>Ver el aviso de &quot;sin entrenador&quot; si algún grupo se ha quedado sin cubrir.</Item>
        </Bloque>
        <Bloque label="No puede">
          <Item>Asignar ni quitar a nadie de un grupo — los botones aparecen, pero no son clicables para él.</Item>
          <Item>Ver el coste/sueldo semanal por entrenador ni el cuadro de personal — esos bloques no le aparecen.</Item>
        </Bloque>
        <Tip>
          <b className="text-signal">En la reunión:</b> es el sitio para que cada uno confirme qué le toca esta
          semana y la que viene, sin que tengas que mandarlo aparte.
        </Tip>
      </Seccion>

      <Seccion n="02" titulo="Entrenamientos">
        <p>
          Las sesiones que tú publicas: contenido del entreno, material
          necesario y a qué grupos va dirigido.
        </p>
        <Bloque label="Puede">
          <Item ok>Leer el contenido completo de cada sesión publicada.</Item>
          <Item ok>Marcar como vista una sesión, para que quede constancia de que la ha leído.</Item>
        </Bloque>
        <Bloque label="No puede">
          <Item>Ver los borradores que aún estés preparando — solo lo ya publicado.</Item>
          <Item>Editar ni publicar sesiones — eso sigue siendo solo tuyo.</Item>
        </Bloque>
      </Seccion>

      <Seccion n="03" titulo="Entreno diario">
        <p>
          De quien tiene Strava conectado: sus entrenos de los{" "}
          <b className="text-chalk">últimos 7 días</b> — distancia, tiempo,
          ritmo/velocidad, desnivel, FC media y máxima, y vatios si llevan
          potenciómetro.
        </p>
        <Bloque label="Puede">
          <Item ok>
            Anotar el RPE (percepción del esfuerzo, del 1 al 10) de cada
            sesión, con una nota si quiere.
          </Item>
        </Bloque>
        <Tip>
          <b className="text-signal">Este es el único dato de rendimiento que registra un entrenador</b> — todo
          lo demás de análisis (histórico de tests, perfil fisiológico,
          gráficos de evolución, carga de entrenamiento CTL/ATL/TSB) queda
          dentro de Análisis, que es solo tuyo.
        </Tip>
      </Seccion>

      <Seccion n="04" titulo="Registrar test">
        <p>
          Da de alta el resultado de un test del catálogo del club a un
          deportista: tiempo, distancia, FC, RPE… Queda guardado con su
          nombre como quien lo registró.
        </p>
        <Tip>
          <b className="text-signal">En la reunión:</b> recuerda que cada test se guarda con la fecha y quién lo
          tomó — si dos entrenadores miden lo mismo el mismo día, hay que
          avisar para no duplicarlo.
        </Tip>
      </Seccion>

      <Seccion n="05" titulo="Grupos">
        <p>
          Lista de los grupos activos del club y quién está apuntado en cada
          uno — para consultar rápido &quot;¿de qué grupo es este
          deportista?&quot; sin tener que preguntar.
        </p>
      </Seccion>

      <Seccion n="06" titulo="Deportistas">
        <p>
          Nombre, referencia, categoría y a qué grupos pertenece cada
          deportista del club.
        </p>
        <Bloque label="No puede">
          <Item>Editar datos, ni dar de alta o de baja a nadie — solo consulta.</Item>
        </Bloque>
      </Seccion>

      <Seccion n="07" titulo="Competiciones">
        <p>
          Dos pestañas: <b className="text-chalk">Próximas</b> (calendario de
          carreras del club) y <b className="text-chalk">Resultados</b> (lo
          ya corrido).
        </p>
        <Bloque label="No puede">
          <Item>Añadir ni borrar resultados ni carreras del calendario — solo lectura.</Item>
        </Bloque>
      </Seccion>

      <Seccion n="08" titulo="Rankings">
        <p>
          La mejor marca de cada deportista activo por prueba y categoría
          esta temporada — pensado como contenido fácil de compartir en
          redes.
        </p>
        <Tip>
          Muestra solo la mejor marca, nunca el histórico completo de
          intentos de un deportista — esa frontera se queda en Análisis.
        </Tip>
      </Seccion>

      <Seccion n="09" titulo="Rutas">
        <div className="flex gap-1.5 mb-2">
          <span className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px] bg-bike/15 text-bike">
            Carretera
          </span>
          <span className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px] bg-bike/15 text-bike">
            Montaña
          </span>
        </div>
        <p>
          Biblioteca de salidas de ciclismo reales, hechas por gente del club
          con Strava conectado, agrupadas por distancia y desnivel parecidos.
        </p>
        <Bloque label="No puede">
          <Item>Sincronizar rutas nuevas — ese botón es solo tuyo.</Item>
        </Bloque>
      </Seccion>

      <div className="lane my-5" />

      <h2 className="font-display text-[14px] tracking-[.1em] uppercase text-mute mb-2.5">
        Resumen para la reunión
      </h2>
      <div className="bg-surf border border-edge rounded-[10px] overflow-hidden mb-5">
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Reparto", "Solo lectura"],
              ["Entrenamientos", "Solo lo publicado"],
              ["Entreno diario", "Últimos 7 días + RPE"],
              ["Registrar test", "Alta de resultados"],
              ["Grupos", "Consulta"],
              ["Deportistas", "Consulta"],
              ["Competiciones", "Solo lectura"],
              ["Rankings", "Mejor marca, sin histórico"],
              ["Rutas", "Consulta"],
            ].map(([nombre, valor], i, arr) => (
              <tr key={nombre} className={i < arr.length - 1 ? "border-b border-edge" : ""}>
                <td className="px-3 py-2 font-medium">{nombre}</td>
                <td className="px-3 py-2 text-mute">{valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surf2 border border-edge rounded-[10px] p-4">
        <b className="block text-[15px] font-medium mb-1">Lo que ningún entrenador ve</b>
        <p className="text-sm text-mute leading-relaxed">
          Publicar · Análisis (histórico de tests, perfil fisiológico, Strava
          avanzado, carga de entrenamiento) · Resultados (listado completo y
          exportación) · Equipo · Liga de Talentos · todo Administración
          (Balance, Facturas, Pedidos, Jornadas, Pagos, Horarios,
          Inscripciones, Cuotas por Stripe, Previsión de entrenadores).
        </p>
      </div>
    </AppShell>
  );
}

function Seccion({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3 text-sm text-chalk leading-relaxed [&>p]:mb-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display font-bold text-signal text-xs tracking-[.04em]">{n}</span>
        <h2 className="font-display text-lg font-bold">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

function Bloque({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5">
      <span className="font-display text-[11px] tracking-[.08em] uppercase text-mute block mb-1">{label}</span>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function Item({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-1.5">
      <span className={ok ? "text-ok" : "text-run"}>•</span>
      <span>{children}</span>
    </li>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2.5 bg-surf2 border-l-[3px] border-signal rounded-r-lg px-3 py-2 text-[13px] leading-relaxed">
      {children}
    </div>
  );
}
