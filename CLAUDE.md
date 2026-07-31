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

La plantilla de la temporada (9 personas) ya no es un array fijo en el
código: vive en la tabla `personal_temporada` (nombre, email, teléfono —
ver `docs/migracion_personal_temporada.sql`) y se cruza por email con
`perfiles` para saber quién ya tiene cuenta. El email es la clave de cruce,
no el nombre (Google manda el nombre completo, no el apodo del club).

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
