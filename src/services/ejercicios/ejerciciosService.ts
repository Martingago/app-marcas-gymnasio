import { db } from "@/database";
import { ejercicios } from "@/db/schema/ejercicios";
import { categorias } from "@/db/schema/categorias";
import { eq, asc, and, like } from "drizzle-orm";
import { CrearEjercicioDTO, EditarEjercicioDTO, Ejercicio } from "@/interfaces/ejercicio";

/**
 * Obtiene todos los ejercicios (Opcionalmente filtrados por categoría).
 */
export const getEjercicios = async (
  categoria_id?: number | null,
  searchQuery?: string
): Promise<Ejercicio[]> => {
  let query = db
    .select({
      id: ejercicios.id,
      nombre: ejercicios.nombre,
      categoria_id: ejercicios.categoriaId,
      categoria_nombre: categorias.nombre,
    })
    .from(ejercicios)
    .leftJoin(categorias, eq(ejercicios.categoriaId, categorias.id))
    .$dynamic();

  // Array para guardar los filtros que se vayan aplicando
  const filtros =[];

  if (categoria_id) {
    filtros.push(eq(ejercicios.categoriaId, categoria_id));
  }
  
  if (searchQuery && searchQuery.trim() !== '') {
    // Busca coincidencias en cualquier parte del nombre
    filtros.push(like(ejercicios.nombre, `%${searchQuery.trim()}%`));
  }

  // Si hay filtros, los combinamos con AND
  if (filtros.length > 0) {
    query = query.where(and(...filtros));
  }

  return await query.orderBy(asc(ejercicios.nombre));
};

/**
 * Añade un nuevo ejercicio y devuelve la entidad completa (con el nombre de la categoría).
 */
export const addEjercicio = async (data: CrearEjercicioDTO): Promise<Ejercicio> => {
  // 1. Insertamos y obtenemos el nuevo ID
  const insertResult = await db
    .insert(ejercicios)
    .values({
      nombre: data.nombre,
      categoriaId: data.categoria_id,
    })
    .returning({ id: ejercicios.id });

  const nuevoId = insertResult[0].id;

  // 2. Buscamos el ejercicio recién creado con su JOIN para tener la entidad completa
  const resultCompleto = await db
    .select({
      id: ejercicios.id,
      nombre: ejercicios.nombre,
      categoria_id: ejercicios.categoriaId,
      categoria_nombre: categorias.nombre,
    })
    .from(ejercicios)
    .leftJoin(categorias, eq(ejercicios.categoriaId, categorias.id))
    .where(eq(ejercicios.id, nuevoId));

  return resultCompleto[0];
};

/**
 * Actualiza un ejercicio existente y devuelve la entidad completa actualizada.
 */
export const updateEjercicio = async (data: EditarEjercicioDTO): Promise<Ejercicio> => {
  // 1. Actualizamos
  await db
    .update(ejercicios)
    .set({
      nombre: data.nombre,
      categoriaId: data.categoria_id,
    })
    .where(eq(ejercicios.id, data.id));

  // 2. Recuperamos el ejercicio actualizado con el nombre de su categoría
  const resultCompleto = await db
    .select({
      id: ejercicios.id,
      nombre: ejercicios.nombre,
      categoria_id: ejercicios.categoriaId,
      categoria_nombre: categorias.nombre,
    })
    .from(ejercicios)
    .leftJoin(categorias, eq(ejercicios.categoriaId, categorias.id))
    .where(eq(ejercicios.id, data.id));

  return resultCompleto[0];
};

/**
 * Elimina un ejercicio por su ID.
 */
export const deleteEjercicio = async (id: number): Promise<void> => {
  await db
    .delete(ejercicios)
    .where(eq(ejercicios.id, id));
};