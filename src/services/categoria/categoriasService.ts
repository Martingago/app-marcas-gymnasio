import db from "@/database";
import { Categoria, CrearCategoriaDTO, EditarCategoriaDTO } from "@/interfaces/categoria";

/**
 * Obtiene la lista de categorías.
 */
export const getCategorias = (): Categoria[] => {
  return db.getAllSync<Categoria>('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
};

/**
 * Añade una nueva categoría.
 */
export const addCategoria = (data: CrearCategoriaDTO): number => {
  const result = db.runSync('INSERT INTO categorias (nombre) VALUES (?)', [data.nombre]);
  return result.lastInsertRowId;
};

/**
 * Actualiza el nombre de una categoría existente.
 */
export const updateCategoria = (data: EditarCategoriaDTO): void => {
  db.runSync('UPDATE categorias SET nombre = ? WHERE id = ?', [data.nombre, data.id]);
};

/**
 * Elimina una categoría por su ID.
 * (Nota: En database.ts le pusimos ON DELETE SET NULL, 
 * por lo que los ejercicios de esta categoría no se borrarán, solo quedarán sin categoría).
 */
export const deleteCategoria = (id: number): void => {
  db.runSync('DELETE FROM categorias WHERE id = ?', [id]);
};