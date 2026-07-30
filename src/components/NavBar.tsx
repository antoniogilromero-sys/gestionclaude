"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DIRECTOR_ITEMS = [
  { href: "/reparto", label: "Reparto" },
  { href: "/publicar", label: "Publicar" },
  { href: "/entrenamientos", label: "Entrenamientos" },
  { href: "/resultados", label: "Resultados" },
  { href: "/analisis", label: "Análisis" },
  { href: "/equipo", label: "Equipo" },
  { href: "/deportistas", label: "Deportistas" },
];

const ENTRENADOR_ITEMS = [
  { href: "/entrenamientos", label: "Entrenamientos" },
  { href: "/tests", label: "Registrar test" },
];

export function NavBar({ rol }: { rol: "director" | "entrenador" | "pendiente" }) {
  const pathname = usePathname();
  if (rol === "pendiente") return null;
  const items = rol === "director" ? DIRECTOR_ITEMS : ENTRENADOR_ITEMS;

  return (
    <div className="relative bg-surf border-b border-edge">
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
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 font-display text-xs tracking-[.06em] uppercase px-3 py-1.5 rounded-full border ${
                active ? "bg-signal text-[#160800] border-signal font-semibold" : "text-mute border-edge"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surf to-transparent" />
    </div>
  );
}
