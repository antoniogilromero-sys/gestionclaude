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
Esto reemplaza el cálculo manual de `CUADRANTE_ENTRENADORES_26_27.xlsx`. La
plantilla de entrenadores de la temporada (8, incluida Sonia, que aún no
tiene cuenta) vive como constante `ROSTER_TEMPORADA` en `RepartoGrid.tsx` —
actualízala si cambia el equipo. El grupo de ciclismo de carretera no tiene
horario fijo (`hora_inicio`/`hora_fin` a null): no rehagas eso pensando que
es un dato que falta rellenar, es intencional.

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
