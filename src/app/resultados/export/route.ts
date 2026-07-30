import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { fmtTiempo } from "@/lib/formato";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autenticado", { status: 401 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol !== "director") {
    return new Response("Solo el director puede exportar", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get("test");
  const grupoId = searchParams.get("grupo");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  let query = supabase
    .from("resultados_calc")
    .select(
      "fecha, deportista, deportista_id, grupo_id, test, disciplina, metrica, tiempo_s, distancia_m, potencia_w, ritmo_s, fc_media, fc_max, fc_1min, rpe, registrado_por, notas",
    )
    .order("fecha", { ascending: false });

  if (testId) query = query.eq("tipo_test_id", Number(testId));
  if (grupoId) query = query.eq("grupo_id", Number(grupoId));
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const [{ data: filas, error }, { data: deportistas }, { data: grupos }, { data: perfiles }] =
    await Promise.all([
      query,
      supabase.from("deportistas").select("id, ref, categoria"),
      supabase.from("grupos").select("id, nombre"),
      supabase.from("perfiles").select("id, nombre"),
    ]);

  if (error) return new Response(error.message, { status: 500 });

  const depPorId = new Map((deportistas ?? []).map((d) => [d.id, d]));
  const grupoPorId = new Map((grupos ?? []).map((g) => [g.id, g.nombre]));
  const nombrePorId = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("REGISTRO_TESTS");
  sheet.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Ref", key: "ref", width: 8 },
    { header: "Deportista", key: "deportista", width: 30 },
    { header: "Categoria", key: "categoria", width: 12 },
    { header: "Grupo", key: "grupo", width: 18 },
    { header: "Prueba", key: "prueba", width: 20 },
    { header: "Marca", key: "marca", width: 12 },
    { header: "Ritmo", key: "ritmo", width: 12 },
    { header: "FC media", key: "fc_media", width: 10 },
    { header: "FC max", key: "fc_max", width: 10 },
    { header: "FC 1'", key: "fc_1min", width: 8 },
    { header: "RPE", key: "rpe", width: 6 },
    { header: "Registrado por", key: "por", width: 18 },
    { header: "Notas", key: "notas", width: 26 },
  ];

  for (const r of filas ?? []) {
    const dep = depPorId.get(r.deportista_id);
    const marca =
      r.metrica === "potencia"
        ? `${r.potencia_w ?? ""} W`
        : r.metrica === "distancia"
          ? `${r.distancia_m ?? ""} m`
          : fmtTiempo(r.tiempo_s);
    const ritmo = r.ritmo_s
      ? `${fmtTiempo(r.ritmo_s)}${r.disciplina === "natacion" ? " /100" : " /km"}`
      : "";

    sheet.addRow({
      fecha: r.fecha,
      ref: dep?.ref ?? "",
      deportista: r.deportista,
      categoria: dep?.categoria ?? "",
      grupo: r.grupo_id ? (grupoPorId.get(r.grupo_id) ?? "") : "",
      prueba: r.test,
      marca,
      ritmo,
      fc_media: r.fc_media,
      fc_max: r.fc_max,
      fc_1min: r.fc_1min,
      rpe: r.rpe,
      por: r.registrado_por ? (nombrePorId.get(r.registrado_por) ?? "") : "",
      notas: r.notas,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="resultados_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
