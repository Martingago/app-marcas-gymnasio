import { db } from "@/database";
import { categorias } from "@/db/schema/categorias";
import { eq, asc } from "drizzle-orm";
import {
  Categoria,
  CrearCategoriaDTO,
  EditarCategoriaDTO,
} from "@/interfaces/categoria";

/**
 * Obtiene la lista de categorías.
 */
export const getCategorias = async (): Promise<Categoria[]> => {
  // Select * from categorias order by nombre asc
  return await db.select().from(categorias).orderBy(asc(categorias.nombre));
};

/**
 * Añade una nueva categoría.
 */
export const addCategoria = async (
  data: CrearCategoriaDTO,
): Promise<Categoria> => {
  // Insert y devuelve la fila insertada para obtener el ID
  const result = await db
    .insert(categorias)
    .values({ nombre: data.nombre })
    .returning({
      id: categorias.id,
      nombre: categorias.nombre,
    }); // Devuelve el ID y nombre de la nueva categoría

  return result[0];
};

/**
 * Actualiza el nombre de una categoría existente.
 */
export const updateCategoria = async (
  data: EditarCategoriaDTO,
): Promise<Categoria> => {
  const result = await db 
    .update(categorias)
    .set({ nombre: data.nombre })
    .where(eq(categorias.id, data.id))
    .returning({
      id: categorias.id,
      nombre: categorias.nombre,
    });

  return result[0];
};

/**
 * Elimina una categoría por su ID.
 */
export const deleteCategoria = async (id: number): Promise<void> => {
  await db.delete(categorias).where(eq(categorias.id, id));
};
