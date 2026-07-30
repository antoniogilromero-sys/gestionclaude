# App C.D.E. Triatlón Alpedrete — qué hay que construir

Documento de arranque para la sesión de desarrollo. Recoge las decisiones ya
tomadas para no volver a discutirlas.

---

## Qué resuelve

El director técnico publica los entrenamientos de la semana y los entrenadores
los aplican y registran las marcas de los tests. Hoy eso va por WhatsApp y papel,
y las marcas llegan tarde y a trozos.

**Escala real:** 7 entrenadores, 80 deportistas dados de alta (110 previstos),
unos 500 registros de test por temporada. Es una escala pequeña: entra de sobra
en los planes gratuitos de Supabase y Vercel, y ahí se queda.

---

## Decisiones cerradas

| Tema | Decisión | Por qué |
|---|---|---|
| Stack | Next.js (App Router) + Supabase + Vercel | Coste cero a esta escala, autenticación resuelta |
| Sin conexión | **No hace falta** | Hay cobertura en la piscina. Es una web normal |
| Qué ve un entrenador | **Todo menos el histórico**: todos los deportistas, grupos y entrenamientos | Con el reparto cambiando cada domingo, atarlo a "sus" grupos solo da problemas al cubrir a un compañero |
| Histórico y análisis | **Solo el director** | Es la única frontera del sistema |
| Datos personales en la app | **Ninguno** | Sin DNI, domicilio ni teléfono. Solo nombre, grupo y rendimiento |
| Alta de entrenadores | Se registran, el director aprueba | Nadie ve nada con rol `pendiente` |
| Deportistas | No tienen acceso | Con 38 menores, añadir cuentas de familias es otro proyecto |
| Asignación de grupos | **Semanal**, la hace el director los domingos | No es una relación fija: cada semana cambia |
| Idioma | Español | — |

---

## Base de datos

`schema.sql` está listo. Se pega entero en **Supabase → SQL Editor → Run** y crea
tablas, vista de cálculo, políticas RLS y el catálogo de 20 tests.

Después, una sola vez y a mano:

```sql
update perfiles set rol = 'director' where email = 'TU_CORREO';
```

**La seguridad vive en las políticas RLS, no en la interfaz.** Y ahora se apoya
en un único punto, así que conviene tenerlo claro:

- Un entrenador aprobado lee **todos** los grupos, deportistas, entrenamientos
  publicados y el reparto semanal del equipo.
- Puede registrar y corregir marcas de **cualquier** deportista.
- De la tabla `resultados` solo lee **los últimos 7 días**. Nada anterior.
- El histórico completo y cualquier análisis: solo el director.

Esa ventana de 7 días no es un permiso a medias, es lo mínimo para que la
pantalla de registro funcione: ver a quién lleva tomado, corregir un tiempo mal
metido y cerrar el jueves un test empezado el martes. **Si se amplía, se pierde
la separación entera.**

Quien se registra entra como `pendiente` y no lee absolutamente nada hasta que el
director lo aprueba. Eso lo comprueba la función `aprobado()`, y hay que usarla
en toda política de lectura nueva que se añada.

### La asignación semanal es el corazón del sistema

`asignaciones` guarda quién lleva cada grupo cada semana. La columna `semana`
almacena siempre el lunes, y hay una restricción que lo obliga, para que no
acaben conviviendo tres formas de escribir la misma semana.

La función `entrena_grupo()` ya **no** decide permisos: todos ven a todos. Sirve
para que la app le ponga delante a cada entrenador los grupos que le tocan esa
semana, con el resto disponible por debajo si tiene que cubrir a alguien.

### Grupos de natación de la temporada

| Grupo | Días | Horario |
|---|---|---|
| Escuela jueves *(nombre por confirmar)* | jueves | 18:00–19:00 |
| Peques | martes | 19:00–20:00 |
| Intermedio | martes y jueves | 19:00–20:00 |
| Avanzado | martes y jueves | 19:00–20:00 |
| Adultos competición | martes y jueves | 20:00–21:00 |

Intermedio y Avanzado comparten franja y vaso: son dos grupos simultáneos en
calles distintas, con entrenador propio cada uno. Faltan por añadir los grupos de
carrera, bici y fuerza.

---

## Pantallas

### Entrenador — dos, y ninguna más

**Entrenamientos.** Lista de sesiones publicadas para sus grupos, la más reciente
arriba. Al abrir una, se marca el acuse en `sesion_vista`.

**Registrar test.** Elige prueba y fecha. Sale la lista de deportistas: primero
los de los grupos que lleva esa semana, después el resto, por si cubre a un
compañero. Toca a uno → marcador grande con teclado numérico (minutos y
segundos, o vatios, o metros según la prueba), FC media / máx / al minuto, y RPE
de 0 a 10. Al guardar, la fila se queda en verde con el ritmo calculado. Arriba,
el contador de cuántos lleva sobre el total.

El teclado propio en pantalla es deliberado: se usa con las manos mojadas y a
contraluz. Nada de campos de texto pequeños.

### Director

**Publicar.** Título, fecha, disciplina, grupos que la hacen, contenido de la
sesión y material. El contenido es texto libre con saltos de línea; no hay que
construir un editor de series.

**Entrenamientos.** Todo lo publicado, con quién lo ha abierto.

**Resultados.** Todas las marcas, con filtros por prueba, grupo y fechas.
**Exporta a xlsx con las columnas exactas de la hoja `REGISTRO_TESTS`** del
fichero `ANALISIS_RENDIMIENTO_26_27.xlsx`, para pegarlo y que la ficha de
evolución y la comparativa sigan funcionando sin tocar nada.

**Reparto semanal.** *La pantalla que más vas a usar.* Rejilla de grupos por
entrenador para una semana concreta, con selector de semana. Botón para **copiar
el reparto de la semana anterior**, porque lo normal es que cambien dos o tres
cosas, no todo. Avisa si un grupo se queda sin entrenador o si a alguien le tocan
dos grupos en la misma franja.

**Equipo.** Aprobar entrenadores pendientes y darlos de baja.

**Deportistas.** Alta, baja y cambio de grupo.

`APP_CLUB_prototipo.html` enseña estas pantallas funcionando. Sirve de referencia
visual y de flujo.

---

## Orden de trabajo

1. Proyecto en Supabase, ejecutar `schema.sql`, darse el rol de director.
2. Next.js con el cliente de Supabase y el flujo de acceso por correo.
3. Importar los 80 deportistas desde `BASE_DEPORTISTAS_26_27.xlsx` (nombre, año
   de nacimiento, categoría, grupo; **la columna `ref` guarda el D001** para poder
   cruzar con los Excel más adelante).
4. **Pantalla de reparto semanal.** Va antes que nada de lo demás: sin asignación
   de la semana, un entrenador no ve absolutamente nada.
5. Pantallas de entrenador. Son las que hay que probar primero con gente real.
6. Pantallas de director: publicar, entrenamientos, resultados, equipo.
7. Exportación a xlsx.
8. Desplegar en Vercel, dominio propio si se quiere.

Los pasos 1 a 5 ya dan algo utilizable. El resto puede esperar a que los
entrenadores confirmen que el registro funciona a pie de piscina.

---

## Cosas que decidir sobre la marcha

- **El nombre del grupo de los jueves de 18 a 19.** Está puesto como "Escuela
  jueves" a falta de saber cómo lo llamáis.
- **A qué grupo va cada deportista.** Los 80 hay que repartirlos entre los cinco
  grupos; ahora mismo están agrupados por categoría de edad, que no es lo mismo.
- **12 deportistas sin fecha de nacimiento** en la base, así que sin categoría ni
  grupo. Conviene arreglarlo antes de importar.
- **Los 30 que faltan** hasta los 110: hay que ver si entran por el mismo
  formulario o hay otra vía.
- Aviso por correo cuando se publica un entrenamiento: probablemente sí, pero se
  puede añadir después.

---

## Lo que NO se construye

Sin aplicación nativa ni tiendas. Sin cuentas para deportistas o familias. Sin
chat interno, que para eso ya está el WhatsApp del club. Sin planificación anual
ni periodización: eso lo sigues haciendo tú, y la app solo distribuye el
resultado. El reparto semanal se guarda, pero no se genera solo: la decisión de
quién lleva qué grupo cada semana es tuya.
