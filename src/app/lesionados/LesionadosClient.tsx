"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearLesion,
  marcarRecuperado,
  borrarLesion,
  anadirSeguimiento,
  borrarSeguimiento,
  crearDocumentoLesion,
  borrarDocumentoLesion,
} from "./actions";
import { createClient } from "@/lib/supabase/client";
import { sinAcentos } from "@/lib/texto";
import { toISODateLocal } from "@/lib/date";

type Nota = { id: number; fecha: string; nota: string };
type Documento = { id: number; nombre: string; storagePath: string; creadoEn: string };
type Lesion = {
  id: number;
  deportistaNombre: string;
  fechaLesion: string;
  zona: string | null;
  descripcion: string;
  estado: "activa" | "recuperado";
  fechaRecuperacion: string | null;
  seguimiento: Nota[];
  documentos: Documento[];
};
type Deportista = { id: number; nombre: string };

function fmtFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function diasDesde(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
  return dias;
}

export function LesionadosClient({
  lesiones,
  deportistas,
  esDirector,
}: {
  lesiones: Lesion[];
  deportistas: Deportista[];
  esDirector: boolean;
}) {
  const router = useRouter();
  const [abiertaId, setAbiertaId] = useState<number | null>(null);
  const [verRecuperadas, setVerRecuperadas] = useState(false);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<number | null>(null);

  // --- alta nueva lesión ---
  const [busquedaDep, setBusquedaDep] = useState("");
  const [deportistaId, setDeportistaId] = useState<number | null>(null);
  const [fechaLesion, setFechaLesion] = useState(() => toISODateLocal(new Date()));
  const [zona, setZona] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const depFiltrados = useMemo(() => {
    const q = sinAcentos(busquedaDep.trim().toLowerCase());
    if (!q) return deportistas.slice(0, 8);
    return deportistas.filter((d) => sinAcentos(d.nombre.toLowerCase()).includes(q)).slice(0, 8);
  }, [deportistas, busquedaDep]);

  const activas = lesiones.filter((l) => l.estado === "activa");
  const recuperadas = lesiones.filter((l) => l.estado === "recuperado");

  async function onAlta() {
    setError(null);
    if (!deportistaId) {
      setError("Elige un deportista");
      return;
    }
    setEnviando(true);
    const resultado = await crearLesion({ deportistaId, fechaLesion, zona, descripcion });
    setEnviando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setDeportistaId(null);
    setBusquedaDep("");
    setZona("");
    setDescripcion("");
    setMostrarAlta(false);
    router.refresh();
  }

  async function onMarcarRecuperado(id: number, recuperado: boolean) {
    setCargando(id);
    const resultado = await marcarRecuperado(id, recuperado);
    setCargando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  async function onBorrar(id: number) {
    setCargando(id);
    const resultado = await borrarLesion(id);
    setCargando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Lesionados
        </h2>
        {esDirector && (
          <button
            onClick={() => setMostrarAlta((v) => !v)}
            className="font-display text-xs tracking-[.08em] uppercase text-signal cursor-pointer"
          >
            {mostrarAlta ? "Cancelar" : "+ Nueva lesión"}
          </button>
        )}
      </div>

      {error && <p className="text-run text-sm mb-3">{error}</p>}

      {mostrarAlta && esDirector && (
        <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3.5">
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Deportista
          </label>
          <input
            value={deportistaId ? deportistas.find((d) => d.id === deportistaId)?.nombre ?? "" : busquedaDep}
            onChange={(e) => {
              setDeportistaId(null);
              setBusquedaDep(e.target.value);
            }}
            placeholder="Busca por nombre…"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-1.5"
          />
          {!deportistaId && busquedaDep.trim() && (
            <div className="mb-2.5">
              {depFiltrados.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDeportistaId(d.id);
                    setBusquedaDep(d.nombre);
                  }}
                  className="block w-full text-left bg-deep border border-edge rounded-lg px-2.5 py-2 text-sm mb-1 cursor-pointer"
                >
                  {d.nombre}
                </button>
              ))}
              {depFiltrados.length === 0 && (
                <p className="text-mute text-xs">Nadie encontrado.</p>
              )}
            </div>
          )}

          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1 mt-2">
            Fecha de la lesión
          </label>
          <input
            type="date"
            value={fechaLesion}
            onChange={(e) => setFechaLesion(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2.5"
          />

          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Zona (opcional)
          </label>
          <input
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            placeholder="Rodilla, tobillo, hombro…"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2.5"
          />

          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué ha pasado, diagnóstico si lo hay…"
            className="w-full min-h-[80px] bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-3"
          />

          <button
            onClick={onAlta}
            disabled={enviando}
            className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "Registrar lesión"}
          </button>
        </div>
      )}

      {activas.length === 0 ? (
        <p className="text-mute text-sm text-center py-6">Nadie lesionado ahora mismo.</p>
      ) : (
        activas.map((l) => (
          <LesionCard
            key={l.id}
            lesion={l}
            abierta={abiertaId === l.id}
            onToggle={() => setAbiertaId(abiertaId === l.id ? null : l.id)}
            esDirector={esDirector}
            cargando={cargando === l.id}
            onMarcarRecuperado={() => onMarcarRecuperado(l.id, true)}
            onBorrar={() => onBorrar(l.id)}
            onError={setError}
          />
        ))
      )}

      {recuperadas.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setVerRecuperadas((v) => !v)}
            className="font-display text-xs tracking-[.08em] uppercase text-mute cursor-pointer"
          >
            {verRecuperadas ? "Ocultar" : "Ver"} recuperadas ({recuperadas.length})
          </button>
          {verRecuperadas &&
            recuperadas.map((l) => (
              <LesionCard
                key={l.id}
                lesion={l}
                abierta={abiertaId === l.id}
                onToggle={() => setAbiertaId(abiertaId === l.id ? null : l.id)}
                esDirector={esDirector}
                cargando={cargando === l.id}
                onMarcarRecuperado={() => onMarcarRecuperado(l.id, false)}
                onBorrar={() => onBorrar(l.id)}
                onError={setError}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function LesionCard({
  lesion,
  abierta,
  onToggle,
  esDirector,
  cargando,
  onMarcarRecuperado,
  onBorrar,
  onError,
}: {
  lesion: Lesion;
  abierta: boolean;
  onToggle: () => void;
  esDirector: boolean;
  cargando: boolean;
  onMarcarRecuperado: () => void;
  onBorrar: () => void;
  onError: (e: string) => void;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [fechaNota, setFechaNota] = useState(() => toISODateLocal(new Date()));
  const [nota, setNota] = useState("");
  const [enviandoNota, setEnviandoNota] = useState(false);
  const inputDocRef = useRef<HTMLInputElement>(null);
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const [abriendoDocId, setAbriendoDocId] = useState<number | null>(null);
  const [borrandoDocId, setBorrandoDocId] = useState<number | null>(null);

  async function onSubirDoc(file: File) {
    onError("");
    setSubiendoDoc(true);
    const supabase = createClient();
    const ruta = `${lesion.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;

    const { error: errorSubida } = await supabase.storage
      .from("lesiones-documentos")
      .upload(ruta, file, { contentType: file.type || "application/pdf" });
    if (errorSubida) {
      onError(errorSubida.message);
      setSubiendoDoc(false);
      return;
    }

    const resultado = await crearDocumentoLesion({ lesionId: lesion.id, nombre: file.name, storagePath: ruta });
    setSubiendoDoc(false);
    if ("error" in resultado) {
      onError(resultado.error);
      return;
    }
    if (inputDocRef.current) inputDocRef.current.value = "";
    router.refresh();
  }

  async function onVerDoc(doc: Documento) {
    setAbriendoDocId(doc.id);
    onError("");
    const supabase = createClient();
    const { data, error: errorUrl } = await supabase.storage
      .from("lesiones-documentos")
      .createSignedUrl(doc.storagePath, 120);
    setAbriendoDocId(null);
    if (errorUrl || !data) {
      onError(errorUrl?.message ?? "No se ha podido abrir el documento");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function onBorrarDoc(doc: Documento) {
    setBorrandoDocId(doc.id);
    const resultado = await borrarDocumentoLesion(doc.id, doc.storagePath);
    setBorrandoDocId(null);
    if ("error" in resultado) onError(resultado.error);
    else router.refresh();
  }

  async function onAnadirNota() {
    if (!nota.trim()) {
      onError("Escribe una nota");
      return;
    }
    setEnviandoNota(true);
    const resultado = await anadirSeguimiento({ lesionId: lesion.id, fecha: fechaNota, nota });
    setEnviandoNota(false);
    if ("error" in resultado) {
      onError(resultado.error);
      return;
    }
    setNota("");
    router.refresh();
  }

  async function onBorrarNota(id: number) {
    const resultado = await borrarSeguimiento(id);
    if ("error" in resultado) onError(resultado.error);
    else router.refresh();
  }

  return (
    <div
      className={`bg-surf border rounded-[10px] mb-2.5 overflow-hidden ${
        lesion.estado === "activa" ? "border-run/40" : "border-edge"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left p-3.5 cursor-pointer"
      >
        <div className="min-w-0">
          <b className="block text-[15px] font-medium truncate">{lesion.deportistaNombre}</b>
          <span className="text-xs text-mute">
            {lesion.zona ? `${lesion.zona} · ` : ""}
            desde {fmtFecha(lesion.fechaLesion)}
            {lesion.estado === "activa" && ` · ${diasDesde(lesion.fechaLesion)} días`}
            {lesion.estado === "recuperado" && lesion.fechaRecuperacion && (
              <> · recuperado el {fmtFecha(lesion.fechaRecuperacion)}</>
            )}
          </span>
        </div>
        <span className="text-mute text-xs shrink-0">{abierta ? "▲" : "▼"}</span>
      </button>

      {abierta && (
        <div className="px-3.5 pb-3.5">
          <p className="text-sm text-chalk leading-relaxed mb-3 pt-1 border-t border-edge pt-2.5">
            {lesion.descripcion}
          </p>

          <div className="flex items-center justify-between mb-1.5">
            <span className="font-display text-[11px] tracking-[.08em] uppercase text-mute">
              Documentos
            </span>
            {esDirector && (
              <label className="font-display text-[11px] tracking-[.08em] uppercase text-signal cursor-pointer">
                {subiendoDoc ? "Subiendo…" : "+ Subir"}
                <input
                  ref={inputDocRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  disabled={subiendoDoc}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onSubirDoc(file);
                  }}
                />
              </label>
            )}
          </div>
          {lesion.documentos.length === 0 ? (
            <p className="text-mute text-xs mb-2.5">Sin documentos.</p>
          ) : (
            lesion.documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 bg-deep border border-edge rounded-lg p-2.5 mb-1.5"
              >
                <span className="text-sm truncate min-w-0">{doc.nombre}</span>
                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={() => onVerDoc(doc)}
                    disabled={abriendoDocId === doc.id}
                    className="min-h-[36px] px-2.5 rounded-lg border border-edge text-chalk font-display text-[11px] tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                  >
                    {abriendoDocId === doc.id ? "…" : "Ver"}
                  </button>
                  {esDirector && (
                    <button
                      onClick={() => onBorrarDoc(doc)}
                      disabled={borrandoDocId === doc.id}
                      className="min-h-[36px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                    >
                      {borrandoDocId === doc.id ? "…" : "Borrar"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          <span className="font-display text-[11px] tracking-[.08em] uppercase text-mute block mb-1.5 mt-3">
            Seguimiento
          </span>
          {lesion.seguimiento.length === 0 ? (
            <p className="text-mute text-xs mb-2.5">Sin notas todavía.</p>
          ) : (
            lesion.seguimiento.map((n) => (
              <div key={n.id} className="bg-deep border border-edge rounded-lg p-2.5 mb-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-mute">{fmtFecha(n.fecha)}</span>
                  {esDirector && (
                    <button
                      onClick={() => onBorrarNota(n.id)}
                      className="text-mute text-[11px] underline"
                    >
                      borrar
                    </button>
                  )}
                </div>
                <p className="text-sm mt-1">{n.nota}</p>
              </div>
            ))
          )}

          {esDirector && (
            <div className="mt-2.5">
              <div className="flex gap-1.5 mb-1.5">
                <input
                  type="date"
                  value={fechaNota}
                  onChange={(e) => setFechaNota(e.target.value)}
                  className="bg-deep border border-edge text-chalk rounded-lg p-2 text-sm"
                />
                <input
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Nota de seguimiento…"
                  className="flex-1 bg-deep border border-edge text-chalk rounded-lg p-2 text-sm"
                />
              </div>
              <button
                onClick={onAnadirNota}
                disabled={enviandoNota}
                className="w-full bg-deep border border-edge text-chalk rounded-lg py-2 font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60 mb-3"
              >
                {enviandoNota ? "Guardando…" : "+ Añadir nota"}
              </button>

              <div className="flex gap-2 pt-2 border-t border-edge">
                <button
                  onClick={onMarcarRecuperado}
                  disabled={cargando}
                  className="flex-1 bg-transparent border border-edge text-chalk rounded-lg min-h-[38px] font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60"
                >
                  {lesion.estado === "activa" ? "Marcar recuperado" : "Reabrir"}
                </button>
                {confirmando ? (
                  <button
                    onClick={onBorrar}
                    disabled={cargando}
                    className="flex-1 bg-transparent border border-run text-run rounded-lg min-h-[38px] font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60"
                  >
                    ¿Seguro? Borrar
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmando(true)}
                    className="flex-1 bg-transparent border border-edge text-mute rounded-lg min-h-[38px] font-display text-xs tracking-[.08em] uppercase cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
