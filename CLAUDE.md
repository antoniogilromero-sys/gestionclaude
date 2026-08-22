@AGENTS.md

# App C.D.E. Triatlón Alpedrete

Lee **`docs/QUE_CONSTRUIR.md`** entero antes de tocar nada: es el encargo y
recoge decisiones que costaron varias vueltas de conversación (permisos,
ventana de 7 días de resultados, no sustituir el Excel). No las rehagas sin
preguntar a Antón (director técnico del club, no programador — explícale
las consecuencias prácticas, no los términos técnicos).

- `docs/schema.sql` — esquema de Supabase (pegar en SQL Editor).
- `docs/migracion_*.sql` — ampliaciones posteriores del esquema, en orden.
  Antón las ejecuta a mano; **pregúntale si ya lo ha hecho** antes de dar por
  hecho que esas tablas o grupos existen en producción.
- `docs/COMO_ACTIVAR_GOOGLE.md` — pasos de Google Cloud + Supabase para
  encender el botón de "Entrar con Google" que ya está en `/login`.
- `docs/APP_CLUB_prototipo.html` — prototipo visual/de flujo con los 80
  deportistas reales. Los tokens de diseño (colores, tipografía) están
  replicados en `src/app/globals.css`.

Stack: Next.js (App Router) + Supabase + Vercel, planes gratuitos. Sin
funcionamiento offline. Sin datos personales (DNI, domicilio, teléfono) en la
app — solo nombre, categoría, grupo y rendimiento.

Export a Excel: usar `exceljs`, no `xlsx` (SheetJS) — esa librería tiene
vulnerabilidades de prototype pollution y ReDoS sin parche.

## Ampliación de alcance: análisis de deportistas

Más allá de `QUE_CONSTRUIR.md`, Antón quiere que el análisis de rendimiento sea
una línea de trabajo real del club a futuro, no solo el export a Excel. Por
eso existe `/analisis` (solo director): ficha individual con gráfico de
evolución por prueba, y comparativa de grupo. Usa Recharts. Sigue creciendo
este apartado con cuidado — es donde más valor a futuro tiene la app.

## Ampliación de alcance: carrera, ciclismo, tarifas y coste

El reparto semanal (`/reparto`) ya no es solo natación: incluye grupos de
carrera y ciclismo (ver `docs/migracion_reparto_entrenadores.sql`, que Antón
tiene que ejecutar en Supabase para que existan) y calcula el coste semanal
por entrenador según tarifas guardadas en `tarifas_entrenador` (tarifa
general por disciplina + excepciones por entrenador, ej. Celia cobra más).
Esto reemplaza el cálculo manual de `CUADRANTE_ENTRENADORES_26_27.xlsx`. El
grupo de ciclismo de carretera no tiene horario fijo
(`hora_inicio`/`hora_fin` a null): no rehagas eso pensando que es un dato
que falta rellenar, es intencional.

**El director es también uno de los entrenadores de la plantilla** (Toni,
`antoniogilromero@gmail.com`) — no son dos personas distintas.

## Cuadro de personal y datos de contacto

**Se quitó de `/reparto`** (agosto 2026): Antón nunca ejecutó
`docs/migracion_personal_temporada.sql` en producción, así que el bloque
daba error permanentemente ("no se ha podido cargar"), y pidió
explícitamente eliminarlo en vez de ejecutar la migración pendiente. Ya no
existe `CuadroPersonal` en `RepartoGrid.tsx` ni se piden `personal_temporada`
ni el cruce de `cuentasActivas` en `reparto/page.tsx`. El archivo de
migración se queda en `docs/` sin usar, por si algún día se retoma la idea
— no lo borres pensando que es basura, pero tampoco des por hecho que la
tabla existe en Supabase.

**Antón pidió meter también el número de cuenta bancaria y se le explicó
por qué no**: rompe la decisión ya cerrada de "sin datos personales
sensibles en la app". Aceptó guardar nombre/email/teléfono pero no IBAN.
Si vuelve a pedirlo, recordarle esta conversación antes de añadirlo.

## Ampliación de alcance: gestiones administrativas (facturas)

`/administracion` (solo director) es un apartado nuevo para tareas que el
encargo original dejaba deliberadamente fuera de la app ("lo administrativo
se queda en tus Excel"). Su primera pieza es `/facturas`: emisión de
facturas **exentas de IVA** (art. 20.Uno.13º LIVA — confirmado por Antón,
no lo des por hecho en otro club) con numeración correlativa que **empieza
en 65** porque ya había emitido 1-64 fuera de la app
(`docs/migracion_facturas.sql`).

Decisiones de esta ampliación:
- **Los datos del pagador (nombre, NIF, dirección) NO se guardan como
  perfil reutilizable.** Antón prefirió rellenarlos a mano en cada factura
  antes que crear una ficha de familias en la base de datos — es un dato
  personal más (de padres/madres, no de los deportistas menores) y se
  minimiza no persistiéndolo salvo dentro de la factura ya emitida.
- **Las facturas no se editan ni se borran una vez creadas** (sin política
  RLS de update/delete, a propósito). Es lo que exige Hacienda: un error se
  corrige con una rectificativa, nunca tocando la original.
- Los datos fiscales del emisor (NIF G88525589, dirección) están en
  `src/lib/emisor.ts`, fijos — solo cambian si el club se traslada.

## Ampliación de alcance: un deportista puede estar en varios grupos

Antón reorganizó los grupos de natación en 13 horarios sueltos por día
(ej. "Martes Avanzado 19h" y "Jueves Avanzado 19h" en vez de un único
"Avanzado" que cubría martes y jueves) y confirmó explícitamente que un
mismo deportista puede estar apuntado a varios de esos horarios a la
vez. Por eso `deportistas.grupo_id` (una relación única) dejó de ser
suficiente: ahora la relación deportista↔grupo vive en la tabla
`deportista_grupo` (muchos a muchos, `docs/migracion_grupos_multiples.sql`).

**La columna `deportistas.grupo_id` se queda en la tabla pero la app ya
no la usa para nada** — no la reintroduzcas pensando que es la fuente de
verdad, es un resto histórico. La UI de `/deportistas` cambió de un
desplegable de un grupo a chips para marcar varios, guardados de golpe
con la función `set_grupos_deportista(deportista_id, grupo_ids[])`.

`resultados_calc` ahora expone `grupo_ids` (array) en vez de `grupo_id`;
donde antes se filtraba con `.eq("grupo_id", x)` ahora se filtra con
`.contains("grupo_ids", [x])` — así aparece en la comparativa de un
deportista cualquier grupo al que pertenezca, sin duplicar sus marcas.

## Ampliación de alcance: rankings internos por categoría

`/rankings` (director y entrenador) muestra, por prueba y año, la mejor
marca de cada deportista activo — pensado como contenido fácil de
enseñar en redes ("mejores tiempos 100m libres sub-14 esta temporada").

**Esto toca deliberadamente la frontera de seguridad de `resultados`**
descrita en `schema.sql` ("el historico de marcas y el analisis, no.
Solo el director"). Antón, preguntado explícitamente, pidió que los
entrenadores también vean el ranking. La forma de hacerlo sin abrir esa
frontera entera fue una función `security definer`
(`docs/migracion_rankings.sql`, función `mejores_marcas`) que calcula
SOLO la mejor marca de cada deportista por prueba/año y no expone nada
más: ni el resto del histórico, ni fechas de intentos anteriores, ni
RPE/FC/notas. La tabla `resultados` en sí sigue con la misma RLS de
siempre (entrenador = últimos 7 días, director = todo). Si algún día se
toca esa función, que siga devolviendo solo el mejor-por-deportista, no
el listado completo — es la única razón por la que este agujero es
seguro.

## Ampliación de alcance: qué ven los entrenadores

Antón pidió abrir a los entrenadores: Inicio, Reparto, Entrenamientos,
Registrar test, Grupos y Competiciones (dentro de Análisis).

- **Reparto es de solo lectura para el entrenador**, y le faltan dos
  bloques enteros: el coste/sueldo semanal por entrenador y el cuadro de
  personal (email/teléfono). Antón lo confirmó explícitamente al
  preguntarle — no dio por hecho que "ver reparto" incluyera sueldos
  ajenos. `RepartoGrid` recibe un `esDirector` que oculta esos dos
  bloques y convierte los botones de asignar en `<span>` no clicables
  para quien no sea director. La página también deja de pedir
  `tarifas_entrenador`/`personal_temporada` a la API si no es director,
  no solo de mostrarlo (menos superficie, no solo CSS).
- **Competiciones se separó de `/analisis` a su propia ruta
  `/competiciones`**, visible para ambos roles, porque `/analisis`
  entero sigue siendo solo-director (Ficha y Grupo tocan el histórico de
  marcas, que es la frontera de seguridad de siempre). El entrenador ve
  la lista pero no puede crear ni borrar resultados (`soloLectura` en el
  componente `Competiciones`, más el guard `requireDirector()` de
  siempre en las server actions — las dos cosas, no solo la UI). Esto
  obligó a ampliar la política de lectura de la tabla `competiciones` de
  `es_director()` a `aprobado()` — ver
  `docs/migracion_competiciones_lectura_entrenadores.sql`. Crear/borrar
  sigue siendo solo del director, sin tocar.

## Ampliación de alcance: conexión con Strava

Muchos deportistas ya usan Strava, así que además de los tests manuales
(`/tests`) el director puede ver su volumen real de entrenamiento
(`/analisis`, pestaña Ficha). Decisiones tomadas al construirlo:

- **Los deportistas no tienen cuenta en la app** (solo director/entrenador
  la usan). Por eso conectar Strava es un enlace público sin login, igual
  que `/horario-publico`: `/strava-conectar/[id]`. El director copia el
  enlace de cada deportista desde `/deportistas` (botón "Enlace Strava") y
  se lo manda por WhatsApp; el deportista lo abre, pulsa "Conectar con
  Strava" una vez, y ya está.
- **No se guarda ninguna actividad.** Solo existe `strava_conexiones`
  (token + refresh_token por deportista, `docs/migracion_strava.sql`). Las
  actividades se piden a la API de Strava en directo cada vez que se abre
  la ficha del deportista (`src/lib/strava.ts`,
  `/api/strava/resumen`), incluyendo la renovación automática del token
  cuando caduca (dura ~6h). Menos datos guardados del deportista, menos
  que proteger — coherente con "sin datos personales sensibles" del
  encargo original.
- El alta del token (tras autorizar en Strava) y su renovación **solo las
  hace el servidor con la clave de servicio** (`createAdminClient`, mismo
  patrón que el webhook de inscripciones) — no hay política de
  insert/update/delete en `strava_conexiones`, así que nadie puede escribir
  ahí desde el navegador.
- Hacen falta dos variables de entorno en Vercel: `STRAVA_CLIENT_ID` y
  `STRAVA_CLIENT_SECRET` (de la app registrada en
  https://www.strava.com/settings/api, con "Authorization Callback Domain"
  = `triatlonalpedrete.vercel.app`). Si el dominio de la app vuelve a
  cambiar, hay que actualizar tanto eso en Strava como el `SITE_URL` fijo
  en `src/app/strava-conectar/[id]/page.tsx` y `/api/strava/callback`.
- Por ahora el resumen solo se ve en `/analisis`, que sigue siendo
  solo-director (misma frontera de siempre: histórico de rendimiento
  individual). La API `/api/strava/resumen` ya admite también entrenador
  por si algún día se abre esa pestaña como se hizo con
  `/rankings` — no lo des por hecho sin que Antón lo pida explícitamente.
- El intercambio de código por token con Strava tiene que mandarse como
  `application/x-www-form-urlencoded` (`URLSearchParams`), **no JSON** —
  Strava lo rechaza en silencio con un error genérico
  (`{"resource":"Application","field":"","code":"invalid"}`) si se manda
  como JSON. Costó una ronda de depuración encontrarlo.
- El resumen desglosa por disciplina (natación/ciclismo/carrera, mismo
  criterio que `COLOR_DISC` en `AnalisisClient`) mapeando el `type` de
  Strava (`disciplinaDeStrava` en `src/lib/strava.ts`) — así se puede
  comparar con Tests sin mezclar todo en un único total. También incluye
  ritmo/velocidad (según disciplina), FC media/máxima y desnivel, todo de
  la misma llamada a `/athlete/activities` (sin peticiones extra por
  actividad, para no gastar cupo de la API de Strava).

### Métricas avanzadas (NP/TSS/IF/VI, GAP, deriva de FC)

Antón pidió, además del resumen básico, poder calcular carga de
entrenamiento de verdad (potencia normalizada, TSS, IF, VI en ciclismo y
carrera con Stryd; ritmo ajustado a la pendiente y deriva cardíaca en
carrera). Decisiones tomadas:

- **Perfil fisiológico por deportista**: `fc_reposo`, `ftp_ciclismo_w`,
  `ftp_carrera_w` (Stryd) y `ritmo_umbral_s_km` son columnas nuevas de
  `deportistas` (`docs/migracion_metricas_avanzadas_strava.sql`).
  `fc_max_ref` y `peso_ref` ya existían desde el `schema.sql` original
  pero no tenían ningún formulario — ahora se editan junto a las nuevas en
  el desplegable "Perfil fisiológico" de la Ficha en `/analisis`
  (`PerfilFisiologicoEditor`, acción `actualizarPerfilFisiologico`).
- **Sí se guardan actividades**, a propósito, rompiendo la norma de "nada
  se persiste" del resto de la integración de Strava: calcular NP/TSS
  exige el segundo a segundo de cada actividad (`/activities/{id}/streams`),
  y pedirlo en directo cada vez agotaría el cupo de peticiones de Strava.
  Por eso existe `strava_actividades`, y por eso **la sincronización es
  manual** (botón "Sincronizar" en la Ficha, `sincronizarStrava` en
  `analisis/actions.ts` → `sincronizarActividadesStrava` en
  `src/lib/strava.ts`), no automática ni en segundo plano — este proyecto
  no tiene cron ni workers, son planes gratuitos.
- **NP/potencia media no piden stream**: `weighted_average_watts` /
  `average_watts` ya vienen en el resumen de actividades de Strava si el
  dispositivo mandó potencia real (`device_watts: true`) — vale tanto para
  ciclismo (potenciómetro) como para carrera con Stryd, es el mismo campo.
  Solo GAP y deriva de FC piden el stream (`obtenerStreamsActividad`), y
  solo para carrera/ciclismo (no natación).
- Las fórmulas (`src/lib/stravaMetricas.ts`, funciones puras) son
  estándar del sector: Coggan (NP/IF/VI/TSS), Minetti et al. 2002 (coste
  energético según pendiente, para GAP), método de desacople Potencia:FC
  o Ritmo:FC (1ª mitad vs 2ª mitad) para la deriva cardíaca.
- **Antón pidió también SWOLF y oscilación vertical/tiempo de contacto en
  carrera — eso NO se ha construido porque la API pública de Strava no
  los expone**, ni siquiera si el reloj del deportista los calcula (son
  datos propios de Garmin Connect que Strava no reenvía a apps
  terceras). Si esto se vuelve a pedir, no es un olvido: haría falta una
  integración aparte con la API de Garmin (u otro fabricante), fuera de
  alcance por ahora.
- La ventana de sincronización son los últimos 60 días, hasta 50
  actividades por sincronización — límite deliberado para no disparar el
  número de peticiones a Strava en una sola pulsación del botón.

## Ampliación de alcance: próximas competiciones

`/competiciones` ahora tiene dos pestañas (`CompeticionesTabs`): **Próximas**
y **Resultados** (esta última es la vista que ya existía). Son conceptos
distintos a propósito:

- `competiciones` (ya existía) = resultado de un deportista concreto en
  una carrera que ya pasó (tiempo, clasificación).
- `proximas_competiciones` (nueva, `docs/migracion_proximas_competiciones.sql`)
  = calendario general del club, sin ligar a deportistas — solo nombre,
  fecha, lugar, disciplina y notas. Antón lo confirmó explícitamente: de
  momento es un calendario informativo ("a qué carreras vamos"), no una
  lista de inscritos por carrera. Si más adelante pide saber quién va a
  cada una, hay que añadir una tabla puente tipo `deportista_grupo`, no
  forzarlo dentro de esta tabla.

Misma visibilidad que Resultados: lectura para director y entrenador
(`aprobado()`), alta/borrado solo director (`es_director()`), sin
política de update (igual que `competiciones`: un error se borra y se
vuelve a crear, no se edita). Las carreras con fecha pasada no se borran
solas — se quedan colapsadas en un desplegable "Ya pasadas" al final de
la pestaña Próximas, hasta que el director las borre a mano.

## Ampliación de alcance: programación de entrenamientos (vista semanal)

`/programacion` es una vista distinta de los mismos datos de `/publicar` +
`/entrenamientos` (tabla `sesiones`), no una tabla nueva: en vez de la
lista cronológica de siempre, organiza por día de la semana con
navegación anterior/siguiente (`lunesDe` de `src/lib/date.ts`). Antón
confirmó explícitamente que quería esto — una vista de calendario — y no
planificación por fases/bloques de temporada ni plantillas reutilizables
de entrenamiento (ambas se descartaron al preguntarle). Mismas reglas de
visibilidad que `/entrenamientos`: el entrenador solo ve sesiones
`publicada = true`, el director ve también los borradores (marcados con
un chip "Borrador"). Visible para director y entrenador en el menú, junto
a Entrenamientos.

## Ampliación de alcance: histórico de documentos de pedidos

`/pedidos` incorpora un histórico de los PDF que se mandan al proveedor de
ropa (`DocumentosPedido.tsx`) — antes la app no guardaba ningún archivo en
ningún sitio, esto es la primera vez que se usa **Supabase Storage**
(`docs/migracion_pedidos_documentos.sql`, bucket privado
`pedidos-documentos`).

- El PDF se sube **directo desde el navegador al bucket** (no pasa por una
  server action ni por el servidor de Next.js) — las server actions no son
  el sitio para mover archivos binarios grandes. La action
  `crearDocumentoPedido` solo registra el nombre y la ruta después de que
  la subida ya haya terminado.
- El bucket es privado: se ve con `createSignedUrl` (caduca a los 2
  minutos), nunca con una URL pública fija.
- Mismo criterio de acceso que el resto de `/pedidos`: solo director, tanto
  en la tabla `pedidos_documentos` como en las políticas de
  `storage.objects` del bucket (`es_director()` en las tres, leer/subir/
  borrar).
- Al borrar un documento se borra primero el archivo del bucket y luego la
  fila de la tabla — si algún día se cambia el orden, un fallo a mitad
  dejaría un archivo huérfano en Storage sin fila que lo referencie.

## Ampliación de alcance: documentos en Jornadas de colegios

`/jornadas` incorpora el mismo patrón de histórico de documentos que
`/pedidos` (`DocumentosJornada.tsx`,
`docs/migracion_jornadas_documentos.sql`, bucket privado
`jornadas-documentos`) — mismo diseño, mismo criterio de acceso
(`es_director()`), misma razón: subida directa desde el navegador al
bucket, nunca por una server action. Ver la sección "Histórico de
documentos de pedidos" más arriba para el porqué de cada decisión, es
idéntico aquí salvo el nombre del bucket/tabla.

Primer uso: un listado de los 39 colegios de Educación Infantil y
Primaria de la zona noroeste (Alpedrete, Collado Villalba, Moralzarzal,
Guadarrama, Galapagar, Navacerrada, Cercedilla, San Lorenzo de El
Escorial) con teléfono, dirección y email, para tener a mano al organizar
jornadas de promoción. Teléfono/dirección salen del buscador oficial de
centros de la Comunidad de Madrid (no publica email de los públicos); el
email se sacó de la web propia de cada centro o su ficha en EducaMadrid.

## Ampliación de alcance: informe descargable e entrenamiento diario con RPE

Dos piezas nuevas sobre la integración de Strava, agosto 2026:

- **`/analisis/informe/[id]`** — informe de un deportista para descargar
  (perfil fisiológico, mejores marcas por prueba, competiciones, resumen
  Strava de las últimas 4 semanas), en una página imprimible de fondo
  blanco con `window.print()`, mismo patrón que ya usaba
  `/facturas/[numero]` (`PrintButton`/`ImprimirButton`, sin librería de
  PDF, el navegador hace de motor). Solo director, como el resto de
  `/analisis`. Enlace "Descargar informe" en la Ficha individual.
- **`/entrenamiento-diario`** — a diferencia de `/analisis` (solo
  director), esta pantalla es para **director y entrenador** a
  propósito: Antón confirmó explícitamente que quería que los
  entrenadores pudieran registrar la percepción del esfuerzo (RPE) de
  cada sesión, porque son ellos quienes están presentes en el
  entrenamiento del día a día — no se abrió el resto de `/analisis`
  (histórico de tests, perfil fisiológico) para no romper esa frontera de
  seguridad ya cerrada, esta es una pantalla nueva y separada, con solo
  lo necesario para ver los últimos 7 días de actividades de Strava
  (vatios medio/máximo, FC media/máxima, velocidad, desnivel) y anotar el
  RPE. El RPE no viene de Strava — se guarda en `strava_rpe`
  (`docs/migracion_strava_rpe.sql`), única tabla de Strava en la que
  escriben director **y** entrenador directamente desde el navegador
  (todas las demás tablas de Strava solo las escribe el servidor).
- `obtenerResumenStrava` (`src/lib/strava.ts`) ahora también trae
  `potencia_media_w`/`potencia_max_w` del resumen de actividad de Strava
  (mismo endpoint que ya se pedía, sin coste extra de cupo) — solo si
  `device_watts` es `true`, igual criterio que las métricas avanzadas: no
  mostrar una estimación de Strava como si fuera un dato real de sensor.

## Ampliación de alcance: Balance del club

`/balance` (dentro de Administración, solo director) es dinero real, no
estimaciones — a propósito distinto de `/pagos` (que sigue siendo un
cálculo del coste de nómina según tarifas × horas del reparto, no un
gasto registrado). Antón pidió explícitamente que las nóminas se anoten
a mano como cualquier gasto, no que se calculen solas desde Reparto —
así el balance solo cuenta dinero que de verdad ha entrado o salido.

- Tabla nueva `movimientos_club` (`docs/migracion_balance.sql`): tipo
  ingreso/gasto, categoría, concepto libre, importe, fecha. RLS
  director-only, igual que `facturas` y `pagos_extra`.
- **No duplica `facturas` ni `pagos_extra`** — esas tablas siguen siendo
  la fuente de verdad de facturación y nóminas extra respectivamente. El
  balance las lee y sube a los totales del mes (de solo lectura ahí,
  marcadas "Factura"/"Nómina extra"), pero se gestionan y se borran desde
  sus propios apartados, no desde `/balance`.
- Categorías de gasto fijas, confirmadas por Antón: Nóminas entrenadores,
  Piscina, Pistas de atletismo, Seguro anual, Ropa deportiva, Liga de
  Talentos/Triatlón Adultos, Otros gastos. Ingreso: Cuotas de socios,
  Otros ingresos. Si pide una categoría nueva, añadirla a
  `INGRESO_CATEGORIAS`/`GASTO_CATEGORIAS` en `BalanceView.tsx` — son un
  array fijo en el código, no una tabla, a propósito (pocas y estables).

## Ampliación de alcance: Liga de Talentos

`/liga-talentos` (solo director, confirmado explícitamente: "solo lo
quiero ver yo") es un seguimiento aparte del catálogo fijo de tests del
club — a propósito no reutiliza `tipos_test`/`resultados`, porque aquí
las pruebas son las que Antón decida sobre la marcha (texto libre en
`liga_talentos_marcas.prueba`), no un catálogo cerrado de 20 pruebas.

- `liga_talentos_marcas`: una prueba, un tiempo (ej. "Natación 300m").
  Se muestra como tabla ancha (filas = deportistas, columnas = cada
  prueba distinta que haya), con la mejor marca de cada columna
  resaltada — mismo formato que el Excel de origen de Antón, a
  propósito, para poder comparar de un vistazo.
- `liga_talentos_carreras`: carreras con tramos de duatlón (carrera, T1,
  bici, T2, carrera) y tiempo total. `deportista_id` es opcional y hay un
  campo `equipo` porque algunos resultados son de un equipo de relevos,
  no de un deportista suelto (ej. "Relevo Parejas Mixtos"). Se agrupa por
  nombre de carrera y se ordena por tiempo total — el más rápido primero,
  con medallas 🥇🥈🥉 en los tres primeros.
- Es de **solo visualización por ahora** (sin formulario de alta en la
  app) — Antón confirmó que de momento prefiere pasar los datos y que se
  carguen por SQL en vez de tener que rellenar un formulario cada vez.
  Si más adelante pide meter datos él mismo desde el móvil, hay que
  añadir un formulario, no está construido todavía.
- Al cargar tiempos desde un Excel/ODS, cuidado con los "TIEMPO TOTAL"
  que vienen mal formateados por Excel (ej. "33:58:00" en vez de "33:58"
  cuando el total supera cierto minutaje) — mejor recalcular el total
  sumando los tramos que fiarse del texto de la celda.

## Ampliación de alcance: imagen de Rankings para Instagram

En `/rankings`, botón "📸 Descargar imagen para Instagram" —genera una
imagen cuadrada (1080×1080, `generarImagenRanking` en
`RankingsClient.tsx`) con el top 8 de la prueba/año/categoría
seleccionados, usando el `<canvas>` del navegador (sin librerías, sin
servidor). Antón preguntó por conectar la app con WhatsApp e Instagram:

- **Instagram**: se descartó publicar automáticamente (exige cuenta de
  empresa vinculada a Facebook + revisión de Meta) a favor de esto —
  genera la imagen, el director la sube él mismo. No hay ninguna cuenta
  de Instagram conectada a la app, ni se guarda ni se envía la imagen a
  ningún sitio, solo se descarga.
- **WhatsApp**: Antón pidió mensajes automáticos, pero eso exige la API
  de WhatsApp Business (verificación de empresa por Meta, número
  verificado, plantillas aprobadas, normalmente con coste recurrente por
  mensaje a través de un proveedor tipo Twilio) — se le explicó el
  alcance real y **no se ha construido nada**, queda pendiente si decide
  seguir adelante sabiendo el coste/tiempo que implica. El correo de
  bienvenida automático (Apps Script) sigue siendo el único canal
  realmente automatizado que tiene el club.

## Ampliación de alcance: alta automática de deportista al inscribirse

`/api/inscripciones/webhook` (agosto 2026) ahora, además de guardar la
inscripción y mandar el correo de bienvenida, **da de alta al deportista
automáticamente** en `deportistas` — Antón lo pidió explícitamente
después de que se le confirmara que antes esto no pasaba solo.

- Se crea **sin categoría ni grupo** (eso no se puede inferir del
  formulario) — el director lo rellena después con el botón "editar"
  nuevo en `/deportistas` (nombre/ref/categoría — antes solo eran
  editables los grupos, no estos tres campos, así que se añadió
  `actualizarDatos` en `deportistas/actions.ts` a la vez que esto).
- **No duplica**: si ya existe un deportista con ese nombre exacto
  (`ilike`, no distingue mayúsculas pero sí acentos — no usa
  `unaccent()` porque el webhook usa el cliente JS de Supabase, no SQL
  crudo), no crea una fila nueva. No es infalible (un acento distinto sí
  colaría un duplicado), pero es un filtro razonable para un proceso
  automático — el director sigue pudiendo fusionar duplicados a mano si
  se cuelan, como se ha hecho antes en este proyecto.
- Si el alta automática falla por cualquier motivo, **no rompe el
  webhook**: la inscripción y el correo de bienvenida se guardan igual,
  el fallo solo queda en los logs de Vercel. El director siempre puede
  dar de alta a mano desde `/deportistas` si hace falta.

## Ampliación de alcance: los entrenadores ven los perfiles de deportistas

`/deportistas` (agosto 2026) dejó de ser solo-director: Antón pidió
explícitamente que los entrenadores pudieran ver el grupo de natación de
cada deportista desde su perfil. Como esa página no tiene ningún dato
personal sensible (solo nombre, ref, categoría y grupos — nada de
DNI/domicilio/teléfono, coherente con "sin datos personales" del encargo
original), se abrió en modo solo-lectura en vez de crear una vista
paralela:

- La página ahora deja pasar a cualquier `aprobado()` (no solo
  `rol === "director"`) y calcula `esDirector` para pasarlo a
  `DeportistasList`.
- `DeportistasList` oculta con `esDirector &&` todo lo que modifica datos
  para el entrenador: el botón "+ Alta", "editar" (datos), "Enlace
  Strava", "Dar de baja/Reactivar" y el editor de grupos (el bloque de
  grupos se queda como texto de solo lectura, sin `onClick`). El
  entrenador ve nombre, ref, categoría y grupos de natación de cada
  deportista, nada más.
- Las server actions (`actualizarGrupos`, `cambiarActivo`,
  `actualizarDatos`, `altaDeportista`) ya tenían `requireDirector()` desde
  antes — la vista solo-lectura es defensa en profundidad de la UI, no
  la única barrera.
- Se añadió `/deportistas` a `ENTRENADOR_ITEMS` en `NavBar.tsx` (antes
  solo estaba en `DIRECTOR_ITEMS`). `/grupos` (listado inverso: por grupo
  → sus deportistas) ya era visible para el entrenador desde antes; esto
  añade el sentido contrario (por deportista → sus grupos), que es lo
  que se pidió como "perfil".

## Ampliación de alcance: vincular inscripciones con su deportista, sin duplicar

Antón detectó dos problemas en `/inscripciones` (agosto 2026) tras cargar
el histórico: casi nada salía como "Vinculada" aunque el deportista ya
existiera, y a veces se duplicaba el deportista. Causa real (revisando
`src/app/api/inscripciones/webhook/route.ts`):

- El alta automática comparaba nombres con
  `.filter("nombre", "ilike", nombreCompleto)` — sin comodines `%` eso es
  una **igualdad exacta** salvo mayúsculas/minúsculas, no una búsqueda
  flexible. Un espacio doble, un acento distinto o un espacio final
  (habitual en datos de formulario) hacía que no encontrara al
  deportista que ya existía y creara uno nuevo → duplicado.
- El webhook nunca escribía `inscripciones.deportista_id` — ni al crear
  el deportista ni al encontrarlo ya existente — así que toda
  inscripción salía "Sin vincular" pasara lo que pasara.

Arreglo (`docs/migracion_matching_deportistas.sql`, Antón tiene que
ejecutarlo en Supabase):

- Función `deportista_id_o_alta(nombre)`, `security definer`, que busca
  con `unaccent(lower(trim(nombre)))` (mismo criterio que todas las
  cargas de este proyecto) y solo si no encuentra a nadie da de alta uno
  nuevo — y siempre devuelve el id, que el webhook usa para rellenar
  `inscripciones.deportista_id` justo después de insertar la
  inscripción.
- Un `update` de backfill en el mismo archivo vincula con ese criterio
  todas las inscripciones que ya estaban guardadas (históricas y las que
  habían entrado en vivo desde que existe el alta automática).
- Una consulta de diagnóstico agrupa `deportistas` por nombre
  normalizado para encontrar duplicados ya existentes — **no los
  fusiona sola**, porque dos deportistas reales podrían coincidir en
  nombre por casualidad; hay que revisar la lista con Antón y fusionar
  a mano los que de verdad sean la misma persona (mover sus
  grupos/resultados/tests al que se quede).

## Ampliación de alcance: sincronización completa de Inscripciones (no solo altas)

**Bug encontrado revisando esto (agosto 2026), probablemente la causa
real de "varios apuntados y no se han actualizado":** el Apps Script
(`docs/apps_script_inscripciones.gs`) llevaba apuntando a
`https://gestionclaude.vercel.app/...`, un dominio que da 404 — la app
real está en `triatlonalpedrete.vercel.app` (confirmado también en
`src/app/strava-conectar/[id]/page.tsx` y en el propio correo de
bienvenida). Apps Script no avisa de un 404 salvo que alguien mire los
registros de ejecución a mano, así que ninguna respuesta nueva del
formulario llegaba a la app desde que se instaló — todo lo que hay
cargado hasta ahora entró por la carga manual del histórico, no por el
webhook en vivo. Corregido el dominio en el script y en
`docs/COMO_ACTIVAR_GOOGLE.md`.

Aprovechando que había que arreglar eso, Antón pidió además que
Administración > Inscripciones sea **siempre un espejo exacto** del
Google Sheet — no solo que se añadan altas nuevas, sino que lo que se
borre o cambie en la hoja también se refleje, y sin duplicados. Por eso
además del webhook de una fila suelta (`/api/inscripciones/webhook`, se
mantiene como red de seguridad) existe ahora
`/api/inscripciones/sincronizar`:

- El Apps Script, en vez de mandar solo la respuesta que acaba de
  llegar, **relee la hoja entera** (`leerTodasLasFilas`) y manda todas
  las filas de golpe cada vez que entra una respuesta nueva
  (`sincronizarTodoAhora`, también se puede ejecutar a mano desde el
  editor de Apps Script sin esperar a una respuesta nueva).
- El endpoint hace insertar/actualizar/**borrar**: cualquier
  inscripción que ya no esté en la hoja se borra de la tabla (no toca al
  deportista vinculado, solo el registro administrativo). El
  emparejamiento es por nombre normalizado
  (`normalizarNombre` en `src/lib/inscripciones.ts`, mismo criterio
  unaccent+lower+trim que el resto del proyecto) — no hay ningún id
  estable que venga de Google Sheets.
- **Guardia de seguridad**: si llegan menos de `MINIMO_FILAS` (10) filas
  válidas, el endpoint rechaza la petición sin tocar nada, por si el
  Apps Script no llegó a leer bien la hoja — así un fallo de lectura no
  puede borrar sin querer toda la tabla.
- Procesa las filas en lotes de 8 en paralelo (`TAMANO_LOTE`) para no
  encadenar ~100 idas y vueltas seguidas a Supabase; tiene
  `export const maxDuration = 60` por margen, ya que este endpoint no lo
  llama nadie esperando una respuesta rápida en pantalla (lo llama Apps
  Script en segundo plano).
- Cada fila procesada pasa también por `deportista_id_o_alta` (igual que
  el webhook de una fila), así que sigue dando de alta y vinculando
  deportistas automáticamente.
- `src/lib/inscripciones.ts` saca a un sitio común el parseo de fecha,
  limpieza de campos y normalización de nombre que antes solo vivían
  dentro del webhook de una fila — los dos endpoints los comparten ahora.

## Cosas que se rompen en este proyecto (aprendidas revisando)

- **Pegar un SQL grande con acentos/ñ en el SQL Editor de Supabase puede
  corromper esos caracteres** (mojibake: "García" se guarda como
  "GarcÃa", "Gómez" como "GÃ³mez"). Pasó al cargar el histórico de
  inscripciones (agosto 2026): el nombre corrupto no coincidía con el ya
  existente en `deportistas` ni siquiera con `unaccent()` (esa función
  quita acentos de verdad, no arregla un símbolo "Ã" que es una letra
  distinta), así que se creaban personas duplicadas sin que ninguna
  comparación por nombre lo detectara. El arreglo, si vuelve a pasar:
  `update tabla set columna = convert_from(convert_to(columna, 'LATIN1'), 'UTF8') where columna like '%Ã%'`
  en cada columna de texto afectada — revierte exactamente esta
  corrupción (UTF-8 releído como Latin-1). Después hay que repetir la
  fusión de duplicados (`nombres_parecidos`/`fusionar_deportistas`,
  `docs/migracion_detectar_duplicados.sql`), porque los que antes no
  coincidían por el símbolo raro ahora sí. La sincronización en vivo
  desde el Google Forms (`/api/inscripciones/sincronizar`) no debería
  sufrir esto — va por JSON sobre HTTP, sin el paso de copiar/pegar un
  bloque de SQL a mano que fue lo que lo causó aquí.
- **Supabase corta las consultas en 1000 filas.** Cualquier listado que
  pueda crecer con las temporadas (sobre todo el export a Excel, que es el
  respaldo del club) tiene que paginar con `.range()`, o saldrá incompleto
  sin dar ningún error.
- **Los botones se pulsan con las manos mojadas**: mínimo 44px de alto en
  cualquier cosa que se toque a pie de piscina.
- **Escribir en dos tablas seguidas no es atómico.** Si la segunda falla, no
  dejes la primera en un estado visible y roto (ver `publicarSesion`, que
  crea borrador y solo publica al final).
- **Los mensajes de "no hay nada" se multiplican** cuando la lista crece:
  ponlos una vez arriba, no dentro de cada tarjeta, y di qué hacer.
- **Nunca uses `throw new Error(...)` dentro de una server action.** Next.js
  redacta el mensaje en producción (solo deja un "digest" ilegible) — Antón
  lo sufrió con las facturas. Todas las actions devuelven
  `{ error: string } | <resultado>` en vez de lanzar, y quien las llama
  comprueba `"error" in resultado`. Si añades una action nueva, sigue este
  patrón o el mensaje de error nunca llegará a la pantalla en Vercel.
