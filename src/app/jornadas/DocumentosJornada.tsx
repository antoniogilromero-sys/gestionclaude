"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { crearDocumentoJornada, borrarDocumentoJornada } from "./actions";

type Documento = {
  id: number;
  nombre: string;
  storage_path: string;
  creado_en: string;
};

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function DocumentosJornada({ documentos }: { documentos: Documento[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [abriendoId, setAbriendoId] = useState<number | null>(null);
  const [borrandoId, setBorrandoId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubir(file: File) {
    setError(null);
    setSubiendo(true);
    const supabase = createClient();
    const ruta = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;

    const { error: errorSubida } = await supabase.storage
      .from("jornadas-documentos")
      .upload(ruta, file, { contentType: file.type || "application/pdf" });
    if (errorSubida) {
      setError(errorSubida.message);
      setSubiendo(false);
      return;
    }

    const resultado = await crearDocumentoJornada({ nombre: file.name, storagePath: ruta });
    setSubiendo(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function onVer(doc: Documento) {
    setAbriendoId(doc.id);
    setError(null);
    const supabase = createClient();
    const { data, error: errorUrl } = await supabase.storage
      .from("jornadas-documentos")
      .createSignedUrl(doc.storage_path, 120);
    setAbriendoId(null);
    if (errorUrl || !data) {
      setError(errorUrl?.message ?? "No se ha podido abrir el documento");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function onBorrar(doc: Documento) {
    setBorrandoId(doc.id);
    setError(null);
    const resultado = await borrarDocumentoJornada(doc.id, doc.storage_path);
    setBorrandoId(null);
    setConfirmandoId(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display text-[13px] tracking-[.1em] uppercase text-mute">
          Documentos
        </h3>
        <label className="font-display text-xs tracking-[.08em] uppercase text-signal cursor-pointer">
          {subiendo ? "Subiendo…" : "+ Subir archivo"}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.doc,.docx"
            className="hidden"
            disabled={subiendo}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSubir(file);
            }}
          />
        </label>
      </div>

      {error && <p className="text-run text-sm mb-2.5">{error}</p>}

      {documentos.length === 0 ? (
        <p className="text-mute text-sm text-center py-4 bg-surf border border-edge rounded-[10px]">
          Todavía no hay ningún documento — súbelo aquí (ej. el listado de colegios de la zona).
        </p>
      ) : (
        documentos.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3 mb-2"
          >
            <div className="min-w-0">
              <b className="block text-sm font-medium truncate">{doc.nombre}</b>
              <span className="text-xs text-mute">{fmtFecha(doc.creado_en)}</span>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <button
                onClick={() => onVer(doc)}
                disabled={abriendoId === doc.id}
                className="min-h-[40px] px-2.5 rounded-lg border border-edge text-chalk font-display text-[11px] tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
              >
                {abriendoId === doc.id ? "…" : "Ver"}
              </button>
              {confirmandoId === doc.id ? (
                <>
                  <button
                    onClick={() => onBorrar(doc)}
                    disabled={borrandoId === doc.id}
                    className="min-h-[40px] px-2.5 rounded-lg border border-run text-run font-display text-[11px] tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                  >
                    {borrandoId === doc.id ? "…" : "Sí"}
                  </button>
                  <button
                    onClick={() => setConfirmandoId(null)}
                    className="min-h-[40px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmandoId(doc.id)}
                  className="min-h-[40px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
                >
                  Borrar
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
