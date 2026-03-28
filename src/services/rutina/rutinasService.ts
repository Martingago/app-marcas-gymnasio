// src\services\rutina\rutinasService.ts

import { db } from "@/database";
import { rutinas } from "@/db/schema/rutina/rutina";

import { rutinaDiaEjercicios } from "@/db/schema/rutina/rutinaDiaEjercicios";
import { eq, sql, inArray, asc } from "drizzle-orm";

import { rutinaDias } from "@/db/schema";
import { ejercicios } from "@/db/schema/ejercicios";
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
  // LEFT JOIN desde rutina_dias: un día sin ejercicios debe aparecer en el resultado;
  // si solo usáramos INNER JOIN, esos días no existirían en la carga y al guardar se perderían.
  return await db
    .select({
      diaId: rutinaDias.id,
      diaNombre: rutinaDias.nombre,
      /** PK de rutina_dia_ejercicios (único por hueco en el día) */
      rutinaDiaEjercicioId: rutinaDiaEjercicios.id,
      /** FK a ejercicios.id — es lo que debe volver al formulario como ejercicio_id al guardar */
      ejercicioMaestroId: rutinaDiaEjercicios.ejercicioId,
      ejercicioNombre: ejercicios.nombre,
      serieOrden: rutinaDiaEjercicioSeries.serieOrden,
      repsObjetivo: rutinaDiaEjercicioSeries.repsObjetivo,
      pesoObjetivo: rutinaDiaEjercicioSeries.pesoObjetivo,
    })
    .from(rutinaDias)
    .leftJoin(rutinaDiaEjercicios, eq(rutinaDias.id, rutinaDiaEjercicios.rutinaDiaId))
    .leftJoin(ejercicios, eq(rutinaDiaEjercicios.ejercicioId, ejercicios.id))
    .leftJoin(rutinaDiaEjercicioSeries, eq(rutinaDiaEjercicios.id, rutinaDiaEjercicioSeries.rutinaDiaEjercicioId))
    .where(eq(rutinaDias.rutinaId, rutinaId))
    .orderBy(
      asc(rutinaDias.orden),
      asc(rutinaDiaEjercicios.orden),
      asc(rutinaDiaEjercicioSeries.serieOrden)
    );
};


export const eliminarRutina = async (rutinaId: number) => {
  // Al borrar la rutina, gracias al { onDelete: "cascade" } de tus schemas, 
  // SQLite borrará automáticamente sus días, ejercicios y series asociadas.
  await db.delete(rutinas).where(eq(rutinas.id, rutinaId));
};

// Editar Rutina (Técnica de Overwrite)
export const editarRutinaCompleta = async (rutinaId: number | string, formData: FormRutina) => {
  // Aseguramos que el ID sea numérico por si React Navigation lo pasa como String
  const idFormateado = Number(rutinaId);

  await db.transaction(async (tx) => {
    // 1. Actualizar el nombre de la Rutina
    await tx.update(rutinas)
            .set({ nombre: formData.nombre })
            .where(eq(rutinas.id, idFormateado));

    // 2. BORRADO EXPLÍCITO Y SEGURO (Previene ejercicios fantasma/huérfanos)
    // Primero, buscamos los IDs de los días que pertenecen a esta rutina
    const diasViejos = await tx.select({ id: rutinaDias.id })
                               .from(rutinaDias)
                               .where(eq(rutinaDias.rutinaId, idFormateado));
    
    const diasViejosIds = diasViejos.map(d => d.id);

    if (diasViejosIds.length > 0) {
      // Buscamos los IDs de todos los ejercicios asociados a esos días
      const ejViejos = await tx.select({ id: rutinaDiaEjercicios.id })
                               .from(rutinaDiaEjercicios)
                               .where(inArray(rutinaDiaEjercicios.rutinaDiaId, diasViejosIds));
      
      const ejViejosIds = ejViejos.map(e => e.id);

      if (ejViejosIds.length > 0) {
        // Borramos primero las SERIES (El eslabón más profundo)
        await tx.delete(rutinaDiaEjercicioSeries)
                .where(inArray(rutinaDiaEjercicioSeries.rutinaDiaEjercicioId, ejViejosIds));
      }

      // Borramos luego los EJERCICIOS
      await tx.delete(rutinaDiaEjercicios)
              .where(inArray(rutinaDiaEjercicios.rutinaDiaId, diasViejosIds));
    }

    // Por último, borramos los DÍAS
    await tx.delete(rutinaDias).where(eq(rutinaDias.rutinaId, idFormateado));

    // 3. Reinsertar todo con la nueva estructura del formulario
    for (let i = 0; i < formData.dias.length; i++) {
      const dia = formData.dias[i];
      const[nuevoDia] = await tx.insert(rutinaDias).values({
        rutinaId: idFormateado,
        nombre: dia.nombre,
        orden: i + 1,
      }).returning({ id: rutinaDias.id });

      for (let j = 0; j < dia.ejercicios.length; j++) {
        const ej = dia.ejercicios[j];
        if (ej.ejercicio_id) {
          const [nuevoEjercicio] = await tx.insert(rutinaDiaEjercicios).values({
            rutinaDiaId: nuevoDia.id,
            ejercicioId: ej.ejercicio_id,
            orden: j + 1
          }).returning({ id: rutinaDiaEjercicios.id });

          for (let k = 0; k < ej.series.length; k++) {
            const serie = ej.series[k];
            await tx.insert(rutinaDiaEjercicioSeries).values({
              rutinaDiaEjercicioId: nuevoEjercicio.id,
              serieOrden: k + 1,
              repsObjetivo: serie.reps_objetivo?.toString() || "0",
              pesoObjetivo: serie.peso_objetivo?.toString() || "0"
            });
          }
        }
      }
    }
  });
};

// Función helper para cargar los datos en la pantalla de edición
export const getRutinaParaEditar = async (rutinaId: number): Promise<FormRutina> => {
  // 1. Obtener nombre
  const[rutinaDb] = await db.select().from(rutinas).where(eq(rutinas.id, rutinaId));
  
  // 2. Obtener todos los detalles
  const detalles = await getRutinaCompleta(rutinaId);

  // 3. Reconstruir el objeto FormRutina
  const formRutina: FormRutina = { nombre: rutinaDb.nombre, dias:[] };
  
  // Usamos mapas para ir agrupando
  const diasMap = new Map<number, any>();
  const ejMap = new Map<number, any>();

  detalles.forEach((row) => {
    // Crear el día si no existe
    if (!diasMap.has(row.diaId)) {
      const nuevoDia = {
        id_temp: Math.random().toString(),
        nombre: row.diaNombre,
        ejercicios:[]
      };
      diasMap.set(row.diaId, nuevoDia);
      formRutina.dias.push(nuevoDia);
    }

    // Crear el ejercicio si no existe (clave = fila en rutina_dia_ejercicios, no el id del catálogo)
    if (row.rutinaDiaEjercicioId != null && !ejMap.has(row.rutinaDiaEjercicioId)) {
      const nuevoEj = {
        id_temp: Math.random().toString(),
        ejercicio_id: row.ejercicioMaestroId ?? null,
        ejercicio_nombre: row.ejercicioNombre ?? undefined,
        series:[]
      };
      ejMap.set(row.rutinaDiaEjercicioId, nuevoEj);
      diasMap.get(row.diaId)!.ejercicios.push(nuevoEj);
    }

    // Añadir la serie (serieOrden puede ser 0 en teoría; no usar truthiness)
    if (
      row.serieOrden != null &&
      row.rutinaDiaEjercicioId != null &&
      ejMap.has(row.rutinaDiaEjercicioId)
    ) {
      ejMap.get(row.rutinaDiaEjercicioId)!.series.push({
        id_temp: Math.random().toString(),
        reps_objetivo: row.repsObjetivo,
        peso_objetivo: row.pesoObjetivo
      });
    }
  });

  return formRutina;
};