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

## Cosas que se rompen en este proyecto (aprendidas revisando)

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
