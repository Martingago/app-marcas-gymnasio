/** Solo dígitos; evita negativos y caracteres no numéricos (reps). */
export function sanitizeRepsInput(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Decimal no negativo: dígitos y un punto/coma como separador decimal.
 */
export function sanitizePesoInput(raw: string): string {
  let t = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const i = t.indexOf(".");
  if (i !== -1) {
    t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, "");
  }
  return t;
}

export function parsePesoNoNegativo(text: string): number {
  const p = parseFloat(String(text).replace(",", "."));
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, p);
}
