"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { crearItem, marcarHecho, borrarItem } from "./actions";

type Item = {
  id: number;
  categoria: string;
  titulo: string;
  nota: string | null;
  enlace: string | null;
  archivo_ruta: string | null;
  archivo_nombre: string | null;
  archivoUrl: string | null;
  es_tarea: boolean;
  hecho: boolean;
  creado_en: string;
};

const CATEGORIAS = [
  "Permisos y Ayuntamiento",
  "Federación",
  "Circuitos",
  "Material",
  "Voluntarios",
  "Patrocinadores",
  "Presupuesto",
  "Comunicación",
  "Otros",
];

export function DuatlonClient({ items, dias }: { items: Item[]; dias: number }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<string>("Todo");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);

  const tareas = items.filter((i) => i.es_tarea);
  const hechas = tareas.filter((i) => i.hecho).length;
  const usadas = CATEGORIAS.filter((c) => items.some((i) => i.categoria === c));
  const visibles = items.filter((i) => filtro === "Todo" || i.categoria === filtro);
  const grupos = CATEGORIAS.map((c) => ({
    c,
    // Tareas pendientes primero, luego documentos y notas, y las hechas al final.
    lista: visibles
      .filter((i) => i.categoria === c)
      .sort((a, b) => orden(a) - orden(b)),
  })).filter((g) => g.lista.length > 0);

  async function ejecutar(accion: () => Promise<{ error: string } | { ok: true }>) {
    setError(null);
    const resultado = await accion();
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Organización Duatlón
      </h2>

      <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3">
        <b className="block text-[16px] font-semibold">I Duatlón Cross Escolar Alpedrete</b>
        <span className="text-sm text-mute">Domingo 28 de febrero de 2027</span>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-deep border border-edge rounded-lg p-2.5">
            <span className="text-[11px] text-mute block mb-0.5">
              {dias >= 0 ? "FALTAN" : "HACE"}
            </span>
            <b className="font-display text-[22px] leading-none">{Math.abs(dias)}</b>
            <span className="text-xs text-mute"> días</span>
          </div>
          <div className="bg-deep border border-edge rounded-lg p-2.5">
            <span className="text-[11px] text-mute block mb-0.5">TAREAS HECHAS</span>
            <b className="font-display text-[22px] leading-none">{hechas}</b>
            <span className="text-xs text-mute"> de {tareas.length}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setMostrarForm((v) => !v)}
        className="w-full bg-signal text-[#160800] rounded-[9px] min-h-[44px] font-display text-sm tracking-[.08em] uppercase font-semibold cursor-pointer mb-3"
      >
        {mostrarForm ? "Cancelar" : "+ Añadir archivo, enlace, nota o tarea"}
      </button>

      {mostrarForm && (
        <NuevoItem
          categoriaInicial={filtro === "Todo" ? CATEGORIAS[0] : filtro}
          onGuardado={() => {
            setMostrarForm(false);
            router.refresh();
          }}
        />
      )}

      {usadas.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {["Todo", ...usadas].map((c) => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              aria-pressed={filtro === c}
              className={`px-3 py-1.5 rounded-full border font-display text-xs tracking-[.04em] cursor-pointer ${
                filtro === c
                  ? "bg-signal text-[#160800] border-signal font-semibold"
                  : "bg-deep text-mute border-edge"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-run text-sm mb-3">{error}</p>}

      {items.length === 0 && (
        <p className="text-mute text-sm text-center py-6">
          Todavía no hay nada. Añade el primer documento o tarea con el botón de arriba.
        </p>
      )}

      {grupos.map(({ c, lista }) => (
        <div key={c} className="mb-4">
          <h3 className="font-display text-[12px] tracking-[.1em] uppercase text-signal mb-1.5">{c}</h3>
          {lista.map((i) => (
            <div
              key={i.id}
              className={`flex items-start gap-2.5 bg-surf border border-edge rounded-[10px] p-3 mb-1.5 ${
                i.es_tarea && i.hecho ? "opacity-55" : ""
              }`}
            >
              {i.es_tarea && (
                <button
                  onClick={() => ejecutar(() => marcarHecho(i.id, !i.hecho))}
                  aria-pressed={i.hecho}
                  aria-label={i.hecho ? `Marcar como pendiente: ${i.titulo}` : `Marcar como hecha: ${i.titulo}`}
                  className={`shrink-0 w-11 h-11 rounded-lg border text-lg cursor-pointer ${
                    i.hecho ? "bg-ok/20 border-ok text-ok" : "bg-deep border-edge text-transparent"
                  }`}
                >
                  ✓
                </button>
              )}
              <div className="flex-1 min-w-0">
                <b className={`block text-[15px] font-medium ${i.es_tarea && i.hecho ? "line-through" : ""}`}>
                  {i.titulo}
                </b>
                {i.nota && <span className="block text-sm text-mute whitespace-pre-line">{i.nota}</span>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {i.enlace && (
                    <a href={i.enlace} target="_blank" rel="noreferrer" className="text-sm text-signal underline">
                      Abrir enlace ↗
                    </a>
                  )}
                  {i.archivo_nombre &&
                    (i.archivoUrl ? (
                      <a
                        href={i.archivoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-signal underline break-all"
                      >
                        📎 {i.archivo_nombre}
                      </a>
                    ) : (
                      <span className="text-sm text-mute">📎 {i.archivo_nombre} (no disponible)</span>
                    ))}
                </div>
              </div>
              {confirmando === i.id ? (
                <div className="shrink-0 flex gap-1.5">
                  <button
                    onClick={async () => {
                      await ejecutar(() => borrarItem(i.id));
                      setConfirmando(null);
                    }}
                    className="min-h-[40px] px-2.5 rounded-lg border border-run text-run font-display text-[11px] uppercase cursor-pointer"
                  >
                    Borrar
                  </button>
                  <button
                    onClick={() => setConfirmando(null)}
                    className="min-h-[40px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] uppercase cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmando(i.id)}
                  aria-label={`Borrar ${i.titulo}`}
                  className="shrink-0 min-h-[40px] min-w-[40px] rounded-lg border border-edge text-mute text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function orden(i: Item) {
  if (i.es_tarea) return i.hecho ? 2 : 0;
  return 1;
}

function NuevoItem({
  categoriaInicial,
  onGuardado,
}: {
  categoriaInicial: string;
  onGuardado: () => void;
}) {
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [titulo, setTitulo] = useState("");
  const [nota, setNota] = useState("");
  const [enlace, setEnlace] = useState("");
  const [esTarea, setEsTarea] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  async function guardar() {
    setError(null);
    const fichero = archivo.current?.files?.[0] ?? null;
    const tituloFinal = titulo.trim() || fichero?.name || "";
    if (!tituloFinal) {
      setError("Pon un título o elige un archivo");
      return;
    }
    setEnviando(true);

    let ruta: string | null = null;
    const supabase = createClient();
    if (fichero) {
      // Nombre seguro para el almacén; el nombre original se guarda aparte.
      const limpio = fichero.name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "_");
      ruta = `${Date.now()}-${limpio}`;
      const { error: errorSubida } = await supabase.storage.from("duatlon").upload(ruta, fichero);
      if (errorSubida) {
        setEnviando(false);
        setError(`No se ha podido subir el archivo: ${errorSubida.message}`);
        return;
      }
    }

    const resultado = await crearItem({
      categoria,
      titulo: tituloFinal,
      nota,
      enlace,
      esTarea,
      archivoRuta: ruta,
      archivoNombre: fichero?.name ?? null,
    });
    setEnviando(false);
    if ("error" in resultado) {
      // Sin entrada que lo apunte, el archivo recién subido sobra.
      if (ruta) await supabase.storage.from("duatlon").remove([ruta]);
      setError(resultado.error);
      return;
    }
    onGuardado();
  }

  const campo = "w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5";
  const etiqueta = "block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1";
  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-4">
      <label className={etiqueta}>Apartado</label>
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <label className={etiqueta}>Título</label>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Plano de zonas, presupuesto ambulancia…"
        className={campo}
      />
      <label className={etiqueta}>Archivo (opcional)</label>
      <input ref={archivo} type="file" className={campo} />
      <label className={etiqueta}>Enlace (opcional)</label>
      <input value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…" className={campo} />
      <label className={etiqueta}>Nota (opcional)</label>
      <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} className={campo} />
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input type="checkbox" checked={esTarea} onChange={(e) => setEsTarea(e.target.checked)} className="w-5 h-5" />
        <span className="text-sm">Es una tarea pendiente (se puede marcar como hecha)</span>
      </label>
      {error && <p className="text-run text-sm mb-2">{error}</p>}
      <button
        onClick={guardar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}
