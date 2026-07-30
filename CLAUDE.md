@AGENTS.md

# App C.D.E. Triatlón Alpedrete

Lee **`docs/QUE_CONSTRUIR.md`** entero antes de tocar nada: es el encargo y
recoge decisiones que costaron varias vueltas de conversación (permisos,
ventana de 7 días de resultados, no sustituir el Excel). No las rehagas sin
preguntar a Antón (director técnico del club, no programador — explícale
las consecuencias prácticas, no los términos técnicos).

- `docs/schema.sql` — esquema de Supabase (pegar en SQL Editor).
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
