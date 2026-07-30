"use client";

import { useEffect } from "react";
import { marcarVisto } from "./actions";

export function MarcarVisto({ sesionId }: { sesionId: number }) {
  useEffect(() => {
    marcarVisto(sesionId).catch(() => {});
  }, [sesionId]);
  return null;
}
