/** Devuelve el id dado y todos los ids de categorías descendientes (hijos, nietos…) */
export function categoriaRaizYDescendientes(
  rootId: number,
  filas: { id: number; parentId: number | null }[]
): number[] {
  const hijosDe = new Map<number | null, number[]>();
  for (const r of filas) {
    const p = r.parentId ?? null;
    if (!hijosDe.has(p)) hijosDe.set(p, []);
    hijosDe.get(p)!.push(r.id);
  }
  const out: number[] = [];
  const visit = (id: number) => {
    out.push(id);
    for (const c of hijosDe.get(id) ?? []) visit(c);
  };
  visit(rootId);
  return out;
}

/** Orden UI: raíces por nombre; bajo cada raíz, hijos por nombre */
export function ordenarCategoriasParaUi<T extends { id: number; nombre: string; parentId: number | null }>(
  filas: T[]
): T[] {
  const hijosDe = new Map<number | null, T[]>();
  for (const r of filas) {
    const p = r.parentId ?? null;
    if (!hijosDe.has(p)) hijosDe.set(p, []);
    hijosDe.get(p)!.push(r);
  }
  for (const arr of hijosDe.values()) arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const raices = hijosDe.get(null) ?? [];
  const out: T[] = [];
  for (const r of raices) {
    out.push(r);
    out.push(...(hijosDe.get(r.id) ?? []));
  }
  const asignados = new Set(out.map((x) => x.id));
  for (const r of filas) {
    if (!asignados.has(r.id)) out.push(r);
  }
  return out;
}
