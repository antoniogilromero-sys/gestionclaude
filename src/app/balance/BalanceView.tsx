"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearMovimiento, borrarMovimiento } from "./actions";

type Movimiento = {
  id: number;
  tipo: "ingreso" | "gasto";
  categoria: string;
  concepto: string | null;
  importe: number;
  fecha: string;
};
type Externo = { id: number; concepto: string; importe: number };

const INGRESO_CATEGORIAS = [
  "Socios club SEPA",
  "Socios transferencia",
  "Subvención",
  "GSD",
  "Otros ingresos",
];
const GASTO_CATEGORIAS = [
  "Piscina",
  "Liga de clubs",
  "Entrenadores",
  "Seguro",
  "Camisetas",
  "Pista",
  "Casas",
  "Licencia",
  "Material",
  "Gorro",
  "Gasolina",
  "Compra",
  "Otros gastos",
];

function formatMes(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const texto = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function fmtFecha(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function euros(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BalanceView({
  mes,
  mesAnterior,
  mesSiguiente,
  mediaIngresos,
  mediaGastos,
  mesesConDatos,
  movimientos,
  facturas,
  pagosExtra,
}: {
  mes: string;
  mesAnterior: string;
  mesSiguiente: string;
  mediaIngresos: number;
  mediaGastos: number;
  mesesConDatos: number;
  movimientos: Movimiento[];
  facturas: Externo[];
  pagosExtra: Externo[];
}) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);

  const ingresosManual = movimientos.filter((m) => m.tipo === "ingreso");
  const gastosManual = movimientos.filter((m) => m.tipo === "gasto");

  const totalIngresos =
    ingresosManual.reduce((s, m) => s + m.importe, 0) + facturas.reduce((s, f) => s + f.importe, 0);
  const totalGastos =
    gastosManual.reduce((s, m) => s + m.importe, 0) + pagosExtra.reduce((s, p) => s + p.importe, 0);
  const saldo = totalIngresos - totalGastos;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link href={`/balance?mes=${mesAnterior}`} className="text-mute hover:text-chalk px-2 py-1" aria-label="Mes anterior">
          ←
        </Link>
        <div className="font-display text-sm tracking-[.08em] uppercase text-mute">{formatMes(mes)}</div>
        <Link href={`/balance?mes=${mesSiguiente}`} className="text-mute hover:text-chalk px-2 py-1" aria-label="Mes siguiente">
          →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
          <span className="text-[11px] text-mute tracking-[.04em] block mb-0.5">INGRESOS</span>
          <b className="font-display text-[19px] block leading-none text-ok">{euros(totalIngresos)} €</b>
        </div>
        <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
          <span className="text-[11px] text-mute tracking-[.04em] block mb-0.5">GASTOS</span>
          <b className="font-display text-[19px] block leading-none text-run">{euros(totalGastos)} €</b>
        </div>
        <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
          <span className="text-[11px] text-mute tracking-[.04em] block mb-0.5">SALDO</span>
          <b className={`font-display text-[19px] block leading-none ${saldo >= 0 ? "text-ok" : "text-run"}`}>
            {euros(saldo)} €
          </b>
        </div>
      </div>

      {mesesConDatos > 0 && (
        <div className="flex items-center justify-between bg-deep border border-edge rounded-[10px] p-3 mb-4 text-sm">
          <span className="text-mute">
            Media mensual ({mesesConDatos} {mesesConDatos === 1 ? "mes" : "meses"} con datos)
          </span>
          <span>
            <span className="text-ok font-medium">{euros(mediaIngresos)} €</span>
            <span className="text-mute"> / </span>
            <span className="text-run font-medium">{euros(mediaGastos)} €</span>
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">Movimientos</h2>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="font-display text-xs tracking-[.08em] uppercase text-signal cursor-pointer"
        >
          {mostrarForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {mostrarForm && (
        <NuevoMovimientoForm
          fechaPorDefecto={mes}
          onGuardado={() => {
            setMostrarForm(false);
            router.refresh();
          }}
        />
      )}

      <Seccion titulo="Ingresos" color="text-ok">
        {ingresosManual.length === 0 && facturas.length === 0 ? (
          <p className="text-mute text-sm">Sin ingresos este mes.</p>
        ) : (
          <>
            {facturas.map((f) => (
              <Fila key={`f${f.id}`} concepto={f.concepto} categoria="Factura" importe={f.importe} soloLectura />
            ))}
            {ingresosManual.map((m) => (
              <Fila
                key={m.id}
                concepto={m.concepto ?? m.categoria}
                categoria={m.categoria}
                fecha={m.fecha}
                importe={m.importe}
                onBorrar={() => borrarMovimiento(m.id).then(() => router.refresh())}
              />
            ))}
          </>
        )}
      </Seccion>

      <Seccion titulo="Gastos" color="text-run">
        {gastosManual.length === 0 && pagosExtra.length === 0 ? (
          <p className="text-mute text-sm">Sin gastos este mes.</p>
        ) : (
          <>
            {pagosExtra.map((p) => (
              <Fila key={`p${p.id}`} concepto={p.concepto} categoria="Nómina extra" importe={p.importe} soloLectura />
            ))}
            {gastosManual.map((m) => (
              <Fila
                key={m.id}
                concepto={m.concepto ?? m.categoria}
                categoria={m.categoria}
                fecha={m.fecha}
                importe={m.importe}
                onBorrar={() => borrarMovimiento(m.id).then(() => router.refresh())}
              />
            ))}
          </>
        )}
      </Seccion>

      <p className="text-xs text-mute mt-4">
        Las facturas se gestionan en <Link href="/facturas" className="underline">Facturas</Link> y las nóminas
        extra en <Link href="/pagos" className="underline">Pagos</Link> — aquí solo se suman a los totales, no
        se pueden borrar desde este apartado.
      </p>
    </div>
  );
}

function Seccion({ titulo, color, children }: { titulo: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className={`font-display text-[13px] tracking-[.1em] uppercase mb-2 ${color}`}>{titulo}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Fila({
  concepto,
  categoria,
  fecha,
  importe,
  soloLectura,
  onBorrar,
}: {
  concepto: string;
  categoria: string;
  fecha?: string;
  importe: number;
  soloLectura?: boolean;
  onBorrar?: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3">
      <div className="min-w-0">
        <b className="block text-sm font-medium truncate">{concepto}</b>
        <span className="text-xs text-mute">
          {categoria}
          {fecha && ` · ${fmtFecha(fecha)}`}
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="font-display text-sm tabular-nums">{euros(importe)} €</span>
        {!soloLectura &&
          onBorrar &&
          (confirmando ? (
            <button
              disabled={borrando}
              onClick={() => {
                setBorrando(true);
                onBorrar();
              }}
              className="text-run text-xs underline cursor-pointer disabled:opacity-60"
            >
              {borrando ? "…" : "confirmar"}
            </button>
          ) : (
            <button onClick={() => setConfirmando(true)} className="text-mute text-xs underline cursor-pointer">
              borrar
            </button>
          ))}
      </div>
    </div>
  );
}

function NuevoMovimientoForm({
  fechaPorDefecto,
  onGuardado,
}: {
  fechaPorDefecto: string;
  onGuardado: () => void;
}) {
  const [tipo, setTipo] = useState<"ingreso" | "gasto">("gasto");
  const categorias = tipo === "ingreso" ? INGRESO_CATEGORIAS : GASTO_CATEGORIAS;
  const [categoria, setCategoria] = useState(categorias[0]);
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(fechaPorDefecto);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarTipo(t: "ingreso" | "gasto") {
    setTipo(t);
    setCategoria(t === "ingreso" ? INGRESO_CATEGORIAS[0] : GASTO_CATEGORIAS[0]);
  }

  async function guardar() {
    setError(null);
    const importeNum = Number(importe.replace(",", "."));
    if (!(importeNum > 0)) {
      setError("El importe tiene que ser mayor que cero");
      return;
    }
    setEnviando(true);
    const resultado = await crearMovimiento({ tipo, categoria, concepto, importe: importeNum, fecha });
    setEnviando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    onGuardado();
  }

  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-4">
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        {(["ingreso", "gasto"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => cambiarTipo(t)}
            className={`min-h-[44px] rounded-lg border font-display text-sm tracking-[.06em] uppercase cursor-pointer ${
              tipo === t
                ? t === "ingreso"
                  ? "bg-ok text-[#0a2a1c] border-ok font-semibold"
                  : "bg-run text-[#2a0a0a] border-run font-semibold"
                : "bg-deep text-chalk border-edge"
            }`}
          >
            {t === "ingreso" ? "Ingreso" : "Gasto"}
          </button>
        ))}
      </div>

      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
        Categoría
      </label>
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
      >
        {categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
        Concepto (opcional)
      </label>
      <input
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        placeholder="Ej. Recibo piscina julio"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
      />

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div>
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Importe (€)
          </label>
          <input
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-run text-sm mb-2">{error}</p>}

      <button
        onClick={guardar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar movimiento"}
      </button>
    </div>
  );
}
