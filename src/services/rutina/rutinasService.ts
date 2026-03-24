// src\services\rutina\rutinasService.ts

import { db } from "@/database";
import { rutinas } from "@/db/schema/rutina/rutina";

import { rutinaDiaEjercicios } from "@/db/schema/rutina/rutinaDiaEjercicios";
import { eq, count, sql } from "drizzle-orm";

import { rutinaDias } from "@/db/schema";
import { FormRutina } from "@/interfaces/form/formRutina";
import { rutinaDiaEjercicioSeries } from "@/db/schema/rutina/rutinaDiaEjerciciosSeries";

// Guardar rutina completa en transacción
export const guardarRutinaCompleta = async (formData: FormRutina) => {
  await db.transaction(async (tx) => {
    // 1. Crear Rutina
    const[nuevaRutina] = await tx.insert(rutinas).values({ nombre: formData.nombre }).returning({ id: rutinas.id });

    // 2. Crear Días
    for (let i = 0; i < formData.dias.length; i++) {
      const dia = formData.dias[i];
      const [nuevoDia] = await tx.insert(rutinaDias).values({
        rutinaId: nuevaRutina.id,
        nombre: dia.nombre,
        orden: i + 1,
      }).returning({ id: rutinaDias.id });

      // 3. Crear Ejercicios
      for (let j = 0; j < dia.ejercicios.length; j++) {
        const ej = dia.ejercicios[j];
        if (ej.ejercicio_id) {
          const [nuevoEjercicio] = await tx.insert(rutinaDiaEjercicios).values({
            rutinaDiaId: nuevoDia.id,
            ejercicioId: ej.ejercicio_id,
            orden: j + 1
          }).returning({ id: rutinaDiaEjercicios.id });

          // 4. Crear las Series para este ejercicio
          for (let k = 0; k < ej.series.length; k++) {
            const serie = ej.series[k];
            await tx.insert(rutinaDiaEjercicioSeries).values({
              rutinaDiaEjercicioId: nuevoEjercicio.id,
              serieOrden: k + 1,
              repsObjetivo: serie.reps_objetivo,
              pesoObjetivo: serie.peso_objetivo
            });
          }
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
      ejercicioId: rutinaDiaEjercicios.id,
      ejercicioNombre: sql<string>`e.nombre`,
      serieOrden: rutinaDiaEjercicioSeries.serieOrden,
      repsObjetivo: rutinaDiaEjercicioSeries.repsObjetivo,
      pesoObjetivo: rutinaDiaEjercicioSeries.pesoObjetivo,
    })
    .from(rutinaDias)
    .innerJoin(rutinaDiaEjercicios, eq(rutinaDias.id, rutinaDiaEjercicios.rutinaDiaId))
    .innerJoin(sql`ejercicios e`, eq(rutinaDiaEjercicios.ejercicioId, sql`e.id`))
    // Hacemos LEFT JOIN por si algún ejercicio se guardó sin series por error
    .leftJoin(rutinaDiaEjercicioSeries, eq(rutinaDiaEjercicios.id, rutinaDiaEjercicioSeries.rutinaDiaEjercicioId))
    .where(eq(rutinaDias.rutinaId, rutinaId))
    // Ordenamos todo jerárquicamente
    .orderBy(rutinaDias.orden, rutinaDiaEjercicios.orden, rutinaDiaEjercicioSeries.serieOrden);
};