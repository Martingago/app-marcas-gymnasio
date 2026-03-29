import { db } from "@/database";
import { categorias } from "@/db/schema/categorias";
import { eq, asc } from "drizzle-orm";
import { ordenarCategoriasParaUi } from "@/lib/categoriasArbol";
import { Categoria, CrearCategoriaDTO, EditarCategoriaDTO } from "@/interfaces/categoria";

export const getCategorias = async (): Promise<Categoria[]> => {
  const rows = await db
    .select({
      id: categorias.id,
      nombre: categorias.nombre,
      parentId: categorias.parentId,
    })
    .from(categorias);
  const mapped: Categoria[] = rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    parentId: r.parentId ?? null,
  }));
  return ordenarCategoriasParaUi(mapped);
};

export const addCategoria = async (data: CrearCategoriaDTO): Promise<Categoria> => {
  const result = await db
    .insert(categorias)
    .values({
      nombre: data.nombre,
      parentId: data.parentId ?? null,
    })
    .returning({
      id: categorias.id,
      nombre: categorias.nombre,
      parentId: categorias.parentId,
    });

  const r = result[0];
  return { id: r.id, nombre: r.nombre, parentId: r.parentId ?? null };
};

export const updateCategoria = async (data: EditarCategoriaDTO): Promise<Categoria> => {
  const result = await db
    .update(categorias)
    .set({
      nombre: data.nombre,
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
    })
    .where(eq(categorias.id, data.id))
    .returning({
      id: categorias.id,
      nombre: categorias.nombre,
      parentId: categorias.parentId,
    });

  const r = result[0];
  return { id: r.id, nombre: r.nombre, parentId: r.parentId ?? null };
};

export const deleteCategoria = async (id: number): Promise<void> => {
  await db.delete(categorias).where(eq(categorias.id, id));
};
