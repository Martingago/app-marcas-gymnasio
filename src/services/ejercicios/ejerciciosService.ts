import { db } from "@/database";
import { ejercicios } from "@/db/schema/ejercicios";
import { categorias } from "@/db/schema/categorias";
import { ejercicioCategorias } from "@/db/schema/ejercicioCategorias";
import { eq, asc, and, like, inArray } from "drizzle-orm";
import { categoriaRaizYDescendientes } from "@/lib/categoriasArbol";
import { CrearEjercicioDTO, EditarEjercicioDTO, Ejercicio } from "@/interfaces/ejercicio";

async function idsFiltroCategoria(categoriaFiltroId: number): Promise<number[]> {
  const todas = await db
    .select({ id: categorias.id, parentId: categorias.parentId })
    .from(categorias);
  const rows = todas.map((r) => ({
    id: r.id,
    parentId: r.parentId ?? null,
  }));
  return categoriaRaizYDescendientes(categoriaFiltroId, rows);
}

function mapRow(
  r: { id: number; nombre: string; categoria_nombre: string | null },
  ids: number[]
): Ejercicio {
  return {
    id: r.id,
    nombre: r.nombre,
    categoria_ids: ids,
    categoria_nombre: r.categoria_nombre,
  };
}

/**
 * Lista ejercicios con nombres de categorías agregados.
 * Sin GROUP_CONCAT en SQL: SQLite móvil a menudo no soporta bien DISTINCT + separador en agregados.
 */
export const getEjercicios = async (
  categoria_id?: number | null,
  searchQuery?: string
): Promise<Ejercicio[]> => {
  const allowedIds =
    categoria_id != null && categoria_id > 0 ? await idsFiltroCategoria(categoria_id) : null;

  if (allowedIds != null && allowedIds.length === 0) {
    return [];
  }

  const conds: ReturnType<typeof and>[] = [];
  if (searchQuery && searchQuery.trim() !== "") {
    conds.push(like(ejercicios.nombre, `%${searchQuery.trim()}%`));
  }

  let ejercicioIdsPorCategoria: number[] | null = null;
  if (allowedIds != null && allowedIds.length > 0) {
    const idRows = await db
      .select({ ejercicioId: ejercicioCategorias.ejercicioId })
      .from(ejercicioCategorias)
      .where(inArray(ejercicioCategorias.categoriaId, allowedIds))
      .groupBy(ejercicioCategorias.ejercicioId);
    ejercicioIdsPorCategoria = idRows.map((r) => r.ejercicioId);
    if (ejercicioIdsPorCategoria.length === 0) return [];
    conds.push(inArray(ejercicios.id, ejercicioIdsPorCategoria));
  }

  const rows =
    conds.length > 0
      ? await db
          .select({ id: ejercicios.id, nombre: ejercicios.nombre })
          .from(ejercicios)
          .where(and(...conds))
          .orderBy(asc(ejercicios.nombre))
      : await db
          .select({ id: ejercicios.id, nombre: ejercicios.nombre })
          .from(ejercicios)
          .orderBy(asc(ejercicios.nombre));
  if (rows.length === 0) return [];

  const eids = rows.map((r) => r.id);
  const links = await db
    .select({
      ejercicioId: ejercicioCategorias.ejercicioId,
      categoriaId: ejercicioCategorias.categoriaId,
      nombreCat: categorias.nombre,
    })
    .from(ejercicioCategorias)
    .innerJoin(categorias, eq(ejercicioCategorias.categoriaId, categorias.id))
    .where(inArray(ejercicioCategorias.ejercicioId, eids))
    .orderBy(asc(ejercicioCategorias.ejercicioId), asc(ejercicioCategorias.categoriaId));

  const byEj = new Map<number, { ids: number[]; nombres: string[] }>();
  for (const l of links) {
    let b = byEj.get(l.ejercicioId);
    if (!b) {
      b = { ids: [], nombres: [] };
      byEj.set(l.ejercicioId, b);
    }
    b.ids.push(l.categoriaId);
    b.nombres.push(l.nombreCat);
  }

  return rows.map((r) => {
    const b = byEj.get(r.id);
    const label = b && b.nombres.length > 0 ? b.nombres.join(" · ") : null;
    return mapRow({ ...r, categoria_nombre: label }, b?.ids ?? []);
  });
};

async function reemplazarCategoriasEjercicio(ejercicioId: number, categoriaIds: number[]): Promise<void> {
  await db.delete(ejercicioCategorias).where(eq(ejercicioCategorias.ejercicioId, ejercicioId));
  const uniq = [...new Set(categoriaIds)].filter((id) => Number.isFinite(id) && id > 0);
  if (uniq.length === 0) return;
  await db.insert(ejercicioCategorias).values(
    uniq.map((categoriaId) => ({
      ejercicioId,
      categoriaId,
    }))
  );
}

export const addEjercicio = async (data: CrearEjercicioDTO): Promise<Ejercicio> => {
  const [ins] = await db.insert(ejercicios).values({ nombre: data.nombre }).returning({ id: ejercicios.id });
  if (!ins) throw new Error("No se pudo crear el ejercicio");
  await reemplazarCategoriasEjercicio(ins.id, data.categoria_ids ?? []);
  const full = await getEjercicioById(ins.id);
  if (!full) throw new Error("Ejercicio no encontrado tras crear");
  return full;
};

export const updateEjercicio = async (data: EditarEjercicioDTO): Promise<Ejercicio> => {
  await db.update(ejercicios).set({ nombre: data.nombre }).where(eq(ejercicios.id, data.id));
  await reemplazarCategoriasEjercicio(data.id, data.categoria_ids ?? []);
  const full = await getEjercicioById(data.id);
  if (!full) throw new Error("Ejercicio no encontrado");
  return full;
};

export const deleteEjercicio = async (id: number): Promise<void> => {
  await db.delete(ejercicios).where(eq(ejercicios.id, id));
};

export const getEjercicioById = async (id: number): Promise<Ejercicio | null> => {
  const rows = await db
    .select({ id: ejercicios.id, nombre: ejercicios.nombre })
    .from(ejercicios)
    .where(eq(ejercicios.id, id))
    .limit(1);
  const r = rows[0];
  if (!r) return null;

  const links = await db
    .select({ categoriaId: ejercicioCategorias.categoriaId, nombreCat: categorias.nombre })
    .from(ejercicioCategorias)
    .innerJoin(categorias, eq(ejercicioCategorias.categoriaId, categorias.id))
    .where(eq(ejercicioCategorias.ejercicioId, id))
    .orderBy(asc(ejercicioCategorias.categoriaId));

  const ids = links.map((l) => l.categoriaId);
  const label = links.length > 0 ? links.map((l) => l.nombreCat).join(" · ") : null;
  return mapRow({ ...r, categoria_nombre: label }, ids);
};
