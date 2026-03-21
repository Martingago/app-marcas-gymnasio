// src\services\entrenamientos\entrenamientosService.ts
import db from "@/database";
import { RutinaDia, RutinaDiaEjercicio } from "@/interfaces/rutina";

/**
 * Determina cuál es el siguiente día de la rutina que toca entrenar.
 * Devuelve un objeto RutinaDia o null si la rutina está vacía.
 */
export const getProximoDiaSugerido = (rutinaId: number): RutinaDia | null => {
  // 1. Buscamos el último entrenamiento hecho de esa rutina
  const ultimoEntreno = db.getFirstSync<{ rutina_dia_id: number }>(
    `
    SELECT rutina_dia_id FROM entrenamientos 
    WHERE rutina_dia_id IN (SELECT id FROM rutina_dias WHERE rutina_id = ?)
    ORDER BY fecha DESC LIMIT 1
  `,
    [rutinaId],
  );

  if (!ultimoEntreno) {
    // Si no hay entrenos previos, devolvemos el primer día de la rutina
    return db.getFirstSync<RutinaDia>(
      "SELECT * FROM rutina_dias WHERE rutina_id = ? ORDER BY orden ASC LIMIT 1",
      [rutinaId],
    );
  }

  // 2. Buscamos el orden del último día realizado
  const diaActual = db.getFirstSync<RutinaDia>(
    "SELECT * FROM rutina_dias WHERE id = ?",
    [ultimoEntreno.rutina_dia_id],
  );

  if (!diaActual) {
    // fallback seguro (por ejemplo volver al primer día)
    return db.getFirstSync<RutinaDia>(
      "SELECT * FROM rutina_dias WHERE rutina_id = ? ORDER BY orden ASC LIMIT 1",
      [rutinaId],
    );
  }

  const proximoDia = db.getFirstSync<RutinaDia>(
    "SELECT * FROM rutina_dias WHERE rutina_id = ? AND orden > ? ORDER BY orden ASC LIMIT 1",
    [rutinaId, diaActual.orden],
  );

  // Si no hay siguiente (era el último día), volvemos al día 1
  return (
    proximoDia ||
    db.getFirstSync<RutinaDia>(
      "SELECT * FROM rutina_dias WHERE rutina_id = ? ORDER BY orden ASC LIMIT 1",
      [rutinaId],
    )
  );
};

/**
 * Obtiene los ejercicios configurados para un día concreto de una rutina.
 * Esto servirá para "precargar" los inputs en la pantalla de entrenamiento.
 */
export const getEjerciciosConfiguradosPorDia = (
  rutinaDiaId: number,
): RutinaDiaEjercicio[] => {
  return db.getAllSync<RutinaDiaEjercicio>(
    `
    SELECT rde.*, e.nombre as ejercicio_nombre 
    FROM rutina_dia_ejercicios rde
    JOIN ejercicios e ON rde.ejercicio_id = e.id
    WHERE rde.rutina_dia_id = ?
    ORDER BY rde.orden ASC
    `,
    [rutinaDiaId],
  );
};
