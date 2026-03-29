/**
 * Presentación de fechas en la UI (español, día/mes/año).
 * Almacenamiento en BD: ISO YYYY-MM-DD.
 */

function parseISOLocal(iso: string): { y: number; m: number; d: number } | null {
  const parts = iso.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** dd/mm/aaaa */
export function formatoFechaDMY(iso: string): string {
  const p = parseISOLocal(iso);
  if (!p) return iso;
  return `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}`;
}

/**
 * Título legible: "Viernes, 3 de mayo de 2025"
 */
export function formatoFechaTituloExtendido(iso: string): string {
  const p = parseISOLocal(iso);
  if (!p) return iso;
  const s = new Date(p.y, p.m - 1, p.d).toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
