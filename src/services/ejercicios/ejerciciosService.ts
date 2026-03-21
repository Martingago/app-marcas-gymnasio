// src\services\ejercicios\ejerciciosService.ts
import db from '@/database';
import { CrearEjercicioDTO, EditarEjercicioDTO, Ejercicio } from '@/interfaces/ejercicio';

/**
 * Obtiene todos los ejercicios.
 * @param categoria_id (Opcional) Si se envía, filtra los ejercicios por esa categoría.
 */
export const getEjercicios = (categoria_id?: number | null): Ejercicio[] => {
  let query = `
    SELECT e.id, e.nombre, e.categoria_id, c.nombre as categoria_nombre 
    FROM ejercicios e
    LEFT JOIN categorias c ON e.categoria_id = c.id
  `;
  
  let params: any[] =[];

  // Si nos pasan un filtro de categoría, añadimos el WHERE
  if (categoria_id) {
    query += ` WHERE e.categoria_id = ?`;
    params.push(categoria_id);
  }

  query += ` ORDER BY e.nombre ASC`;

  // Le pasamos la interfaz <Ejercicio> para que TypeScript sepa qué devuelve
  return db.getAllSync<Ejercicio>(query, params);
};

/**
 * Añade un nuevo ejercicio a la base de datos.
 */
export const addEjercicio = (data: CrearEjercicioDTO): number => {
  // runSync es ideal para INSERT, UPDATE o DELETE. Devuelve el ID insertado.
  const result = db.runSync(
    'INSERT INTO ejercicios (nombre, categoria_id) VALUES (?, ?)',[data.nombre, data.categoria_id]
  );
  return result.lastInsertRowId;
};

/**
 * Actualiza un ejercicio existente.
 */
export const updateEjercicio = (data: EditarEjercicioDTO): void => {
  db.runSync(
    'UPDATE ejercicios SET nombre = ?, categoria_id = ? WHERE id = ?',
    [data.nombre, data.categoria_id, data.id]
  );
};

/**
 * Elimina un ejercicio por su ID.
 */
export const deleteEjercicio = (id: number): void => {
  db.runSync('DELETE FROM ejercicios WHERE id = ?', [id]);
};

