"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; tambien?: string[] };

const DIRECTOR_ITEMS: NavItem[] = [
  { href: "/reparto", label: "Reparto" },
  { href: "/publicar", label: "Publicar" },
  { href: "/entrenamientos", label: "Entrenamientos" },
  { href: "/entrenamiento-diario", label: "Entreno diario" },
  { href: "/tests", label: "Registrar test" },
  { href: "/rankings", label: "Rankings" },
  { href: "/liga-talentos", label: "Liga de Talentos" },
  { href: "/grupos", label: "Grupos" },
  { href: "/competiciones", label: "Competiciones" },
  { href: "/resultados", label: "Resultados" },
  { href: "/analisis", label: "Análisis" },
  { href: "/equipo", label: "Equipo" },
  { href: "/deportistas", label: "Deportistas" },
  {
    href: "/administracion",
    label: "Administración",
    tambien: [
      "/balance",
      "/facturas",
      "/pedidos",
      "/jornadas",
      "/pagos",
      "/horarios",
      "/inscripciones",
      "/prevision-entrenadores",
    ],
  },
];

const ENTRENADOR_ITEMS: NavItem[] = [
  { href: "/reparto", label: "Reparto" },
  { href: "/entrenamientos", label: "Entrenamientos" },
  { href: "/entrenamiento-diario", label: "Entreno diario" },
  { href: "/tests", label: "Registrar test" },
  { href: "/grupos", label: "Grupos" },
  { href: "/deportistas", label: "Deportistas" },
  { href: "/competiciones", label: "Competiciones" },
  { href: "/rankings", label: "Rankings" },
];

export function NavBar({
  rol,
  pendientes = 0,
}: {
  rol: "director" | "entrenador" | "pendiente";
  pendientes?: number;
}) {
  const pathname = usePathname();
  if (rol === "pendiente") return null;
  const items = rol === "director" ? DIRECTOR_ITEMS : ENTRENADOR_ITEMS;

  return (
    <div className="relative bg-nav border-b border-edge">
      <nav className="flex gap-2 overflow-x-auto px-[18px] py-2">
        <Link
          href="/"
          className={`shrink-0 font-display text-xs tracking-[.06em] uppercase px-3 py-1.5 rounded-full border ${
            pathname === "/" ? "bg-signal text-[#160800] border-signal font-semibold" : "text-mute border-edge"
          }`}
        >
          Inicio
        </Link>
        {items.map((item) => {
          const active =
            pathname.startsWith(item.href) ||
            (item.tambien?.some((p) => pathname.startsWith(p)) ?? false);
          const aviso = item.href === "/equipo" ? pendientes : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 font-display text-xs tracking-[.06em] uppercase px-3 py-1.5 rounded-full border ${
                active ? "bg-signal text-[#160800] border-signal font-semibold" : "text-mute border-edge"
              }`}
            >
              {item.label}
              {aviso > 0 && (
                <span
                  className={`rounded-full min-w-[18px] h-[18px] px-1 grid place-items-center text-[11px] font-semibold ${
                    active ? "bg-[#160800] text-signal" : "bg-signal text-[#160800]"
                  }`}
                  title={`${aviso} ${aviso === 1 ? "alta pendiente" : "altas pendientes"} de aprobar`}
                >
                  {aviso}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surf to-transparent" />
    </div>
  );
}
