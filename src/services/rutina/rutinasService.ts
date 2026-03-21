// src\services\rutina\rutinasService.ts

import db from "@/database";
import { Rutina, CrearRutinaDTO, EditarRutinaDTO } from "@/interfaces/rutina";
import { Ejercicio } from "@/interfaces/ejercicio";

/**
 * Obtiene todas las rutinas creadas.
 */
export const getRutinas = (): Rutina[] => {
  return db.getAllSync<Rutina>('SELECT id, nombre FROM rutinas ORDER BY nombre ASC');
};

/**
 * Crea una nueva rutina vacía.
 */
export const addRutina = (data: CrearRutinaDTO): number => {
  const result = db.runSync('INSERT INTO rutinas (nombre) VALUES (?)', [data.nombre]);
  return result.lastInsertRowId;
};

/**
 * Actualiza el nombre de una rutina.
 */
export const updateRutina = (data: EditarRutinaDTO): void => {
  db.runSync('UPDATE rutinas SET nombre = ? WHERE id = ?', [data.nombre, data.id]);
};

/**
 * Elimina una rutina por su ID.
 * (Al tener ON DELETE CASCADE en database.ts, borrará automáticamente 
 * la relación con los ejercicios y los entrenamientos asociados).
 */
export const deleteRutina = (id: number): void => {
  db.runSync('DELETE FROM rutinas WHERE id = ?', [id]);
};

/**
 * Obtiene todos los ejercicios asignados a una rutina específica.
 */
export const getEjerciciosPorRutina = (rutina_id: number): Ejercicio[] => {
  const query = `
    SELECT e.id, e.nombre, e.categoria_id, c.nombre as categoria_nombre 
    FROM ejercicios e
    INNER JOIN rutina_ejercicios re ON e.id = re.ejercicio_id
    LEFT JOIN categorias c ON e.categoria_id = c.id
    WHERE re.rutina_id = ?
    ORDER BY e.nombre ASC
  `;
  return db.getAllSync<Ejercicio>(query, [rutina_id]);
};

/**
 * Asigna un ejercicio existente a una rutina.
 */
export const addEjercicioARutina = (rutina_id: number, ejercicio_id: number): void => {
  // Primero verificamos que no esté ya añadido para evitar duplicados en la misma rutina
  const existe = db.getFirstSync(
    'SELECT id FROM rutina_ejercicios WHERE rutina_id = ? AND ejercicio_id = ?',
    [rutina_id, ejercicio_id]
  );

  if (!existe) {
    db.runSync(
      'INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id) VALUES (?, ?)',[rutina_id, ejercicio_id]
    );
  }
};

/**
 * Quita un ejercicio de una rutina.
 */
export const removeEjercicioDeRutina = (rutina_id: number, ejercicio_id: number): void => {
  db.runSync(
    'DELETE FROM rutina_ejercicios WHERE rutina_id = ? AND ejercicio_id = ?',
    [rutina_id, ejercicio_id]
  );
};