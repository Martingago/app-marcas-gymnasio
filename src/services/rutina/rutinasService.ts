// src\services\rutina\rutinasService.ts

import { db } from "@/database";
import { rutinas } from "@/db/schema/rutinas";
import { rutinaDias } from "@/db/schema/rutina_dias";
import { rutinaDiaEjercicios } from "@/db/schema/rutina_dia_ejercicios";
import { eq, count, sql } from "drizzle-orm";
import { FormRutina } from "@/interfaces/rutina";

// Guardar rutina completa en transacción
export const guardarRutinaCompleta = async (formData: FormRutina) => {
  await db.transaction(async (tx) => {
    // 1. Crear Rutina
    const [nuevaRutina] = await tx.insert(rutinas).values({ nombre: formData.nombre }).returning({ id: rutinas.id });

    // 2. Crear Días y Ejercicios
    for (let i = 0; i < formData.dias.length; i++) {
      const dia = formData.dias[i];
      const [nuevoDia] = await tx.insert(rutinaDias).values({
        rutinaId: nuevaRutina.id,
        nombre: dia.nombre,
        orden: i + 1,
      }).returning({ id: rutinaDias.id });

      // 3. Crear los ejercicios de ese día
      for (let j = 0; j < dia.ejercicios.length; j++) {
        const ej = dia.ejercicios[j];
        if (ej.ejercicio_id) {
          await tx.insert(rutinaDiaEjercicios).values({
            rutinaDiaId: nuevoDia.id,
            ejercicioId: ej.ejercicio_id,
            seriesObjetivo: parseInt(ej.series_objetivo),
            repsObjetivo: ej.reps_objetivo,
            orden: j + 1
          });
        }
      }
    }
  });
};

// Obtener todas las rutinas con su conteo de días
export const getRutinasConDetalle = async () => {
  return await db
    .select({
      id: rutinas.id,
      nombre: rutinas.nombre,
      totalDias: sql<number>`(SELECT COUNT(*) FROM ${rutinaDias} WHERE ${rutinaDias.rutinaId} = ${rutinas.id})`
    })
    .from(rutinas);
};

// Obtener los días y ejercicios de una rutina especifica (para el desplegable)
export const getRutinaCompleta = async (rutinaId: number) => {
  return await db
    .select({
      diaId: rutinaDias.id,
      diaNombre: rutinaDias.nombre,
      ejercicioNombre: sql<string>`e.nombre`,
      seriesObjetivo: rutinaDiaEjercicios.seriesObjetivo,
      repsObjetivo: rutinaDiaEjercicios.repsObjetivo,
    })
    .from(rutinaDias)
    .innerJoin(rutinaDiaEjercicios, eq(rutinaDias.id, rutinaDiaEjercicios.rutinaDiaId))
    .innerJoin(sql`ejercicios e`, eq(rutinaDiaEjercicios.ejercicioId, sql`e.id`))
    .where(eq(rutinaDias.rutinaId, rutinaId))
    .orderBy(rutinaDias.orden, rutinaDiaEjercicios.orden);
};