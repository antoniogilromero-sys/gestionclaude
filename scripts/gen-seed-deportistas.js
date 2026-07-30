const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "docs", "APP_CLUB_prototipo.html"),
  "utf8",
);
const m = html.match(/const ATH = (\[.*?\]);/s);
if (!m) {
  console.error("ATH not found");
  process.exit(1);
}
const ATH = JSON.parse(m[1]);

function sqlString(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

const byGroup = {};
for (const a of ATH) byGroup[a.g] = (byGroup[a.g] || 0) + 1;
console.error("total:", ATH.length);
console.error(byGroup);

const rows = ATH.map((a) => {
  const grupo =
    a.g === "Sin asignar"
      ? "null"
      : `(select id from grupos where nombre = ${sqlString(a.g)})`;
  return `  (${sqlString(a.id)}, ${sqlString(a.n)}, ${sqlString(a.c)}, ${grupo})`;
});

const sql = `-- Generado desde el ATH del prototipo (docs/APP_CLUB_prototipo.html).
-- Los 12 marcados "Sin asignar" son los que aun no tienen fecha de nacimiento
-- ni grupo real confirmado (ver docs/QUE_CONSTRUIR.md, bloqueos pendientes).
-- Pegar en Supabase > SQL Editor > Run. Es idempotente: si ya existe el ref
-- (unique), no duplica.
insert into deportistas (ref, nombre, categoria, grupo_id) values
${rows.join(",\n")}
on conflict (ref) do update set
  nombre    = excluded.nombre,
  categoria = excluded.categoria,
  grupo_id  = excluded.grupo_id;
`;

fs.writeFileSync(
  path.join(__dirname, "..", "docs", "seed_deportistas.sql"),
  sql,
);
console.error("Escrito docs/seed_deportistas.sql con", ATH.length, "filas");
