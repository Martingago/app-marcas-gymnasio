/** Agrupa sesiones por semana (lunes como inicio) para gráficas de rutina */

import { formatoFechaDMY } from "@/lib/fechaFormato";

export type SemanaEntrenos = {
  /** yyyy-mm-dd del lunes */
  semanaInicio: string;
  /** Etiqueta corta para el eje X */
  label: string;
  entrenos: number;
};

function parseIso(s: string): Date | null {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function entrenosPorSemana(fechas: string[]): SemanaEntrenos[] {
  const map = new Map<string, number>();
  for (const f of fechas) {
    const dt = parseIso(f);
    if (!dt) continue;
    const mon = startOfWeekMonday(dt);
    const key = toIso(mon);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const keys = [...map.keys()].sort();
  return keys.map((k) => ({
    semanaInicio: k,
    label: formatoFechaDMY(k),
    entrenos: map.get(k) ?? 0,
  }));
}
