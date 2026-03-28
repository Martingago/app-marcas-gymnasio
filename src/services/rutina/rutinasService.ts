// src\services\rutina\rutinasService.ts

import { db } from "@/database";
import { rutinas } from "@/db/schema/rutina/rutina";

import { rutinaDiaEjercicios } from "@/db/schema/rutina/rutinaDiaEjercicios";
import { eq, sql, asc } from "drizzle-orm";

import { rutinaDias } from "@/db/schema";
import { ejercicios } from "@/db/schema/ejercicios";
import { FormRutina, FormRutinaDiaEjercicio } from "@/interfaces/form/formRutina";
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

/** Días de una rutina ordenados (elegir día para entrenar). */
export const getDiasPorRutina = async (rutinaId: number) => {
  return db
    .select()
    .from(rutinaDias)
    .where(eq(rutinaDias.rutinaId, rutinaId))
    .orderBy(asc(rutinaDias.orden));
};

export type EjercicioDiaEntreno = {
  rutinaDiaEjercicioId: number;
  ejercicioId: number;
  nombre: string;
  orden: number;
  seriesPlantilla: { reps: string; peso: string }[];
};

/** Ejercicios de un día con series objetivo para precargar el entreno */
export const getEjerciciosConSeriesParaEntreno = async (
  rutinaDiaId: number
): Promise<EjercicioDiaEntreno[]> => {
  const rows = await db
    .select({
      rdeId: rutinaDiaEjercicios.id,
      orden: rutinaDiaEjercicios.orden,
      ejId: rutinaDiaEjercicios.ejercicioId,
      ejNombre: ejercicios.nombre,
      serieOrden: rutinaDiaEjercicioSeries.serieOrden,
      repsObjetivo: rutinaDiaEjercicioSeries.repsObjetivo,
      pesoObjetivo: rutinaDiaEjercicioSeries.pesoObjetivo,
    })
    .from(rutinaDiaEjercicios)
    .innerJoin(ejercicios, eq(rutinaDiaEjercicios.ejercicioId, ejercicios.id))
    .leftJoin(
      rutinaDiaEjercicioSeries,
      eq(rutinaDiaEjercicios.id, rutinaDiaEjercicioSeries.rutinaDiaEjercicioId)
    )
    .where(eq(rutinaDiaEjercicios.rutinaDiaId, rutinaDiaId))
    .orderBy(asc(rutinaDiaEjercicios.orden), asc(rutinaDiaEjercicioSeries.serieOrden));

  const map = new Map<number, EjercicioDiaEntreno>();
  for (const r of rows) {
    if (!map.has(r.rdeId)) {
      map.set(r.rdeId, {
        rutinaDiaEjercicioId: r.rdeId,
        ejercicioId: r.ejId!,
        nombre: r.ejNombre!,
        orden: r.orden,
        seriesPlantilla: [],
      });
    }
    if (r.serieOrden != null) {
      map.get(r.rdeId)!.seriesPlantilla.push({
        reps: String(r.repsObjetivo ?? "10"),
        peso: String(r.pesoObjetivo ?? "0"),
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.orden - b.orden);
};

// Editar Rutina: sincronización incremental (conserva ids de días/ejercicios → historial de entrenos)
export const editarRutinaCompleta = async (rutinaId: number | string, formData: FormRutina) => {
  const idFormateado = Number(rutinaId);

  await db.transaction(async (tx) => {
    await tx.update(rutinas).set({ nombre: formData.nombre }).where(eq(rutinas.id, idFormateado));

    const diasExistentes = await tx
      .select({ id: rutinaDias.id })
      .from(rutinaDias)
      .where(eq(rutinaDias.rutinaId, idFormateado));

    const idsExistentesSet = new Set(diasExistentes.map((d) => d.id));
    const idsEnFormulario = new Set<number>();

    const syncEjerciciosDia = async (rutinaDiaDbId: number, ejercicios: FormRutinaDiaEjercicio[]) => {
      const existentes = await tx
        .select({ id: rutinaDiaEjercicios.id })
        .from(rutinaDiaEjercicios)
        .where(eq(rutinaDiaEjercicios.rutinaDiaId, rutinaDiaDbId));

      const idsExistentesEj = new Set(existentes.map((e) => e.id));
      const idsEnFormEj = new Set<number>();

      for (let j = 0; j < ejercicios.length; j++) {
        const ej = ejercicios[j];
        if (!ej.ejercicio_id) continue;

        const orden = j + 1;
        let ejDbId: number;

        if (
          ej.rutinaDiaEjercicioId != null &&
          idsExistentesEj.has(ej.rutinaDiaEjercicioId)
        ) {
          await tx
            .update(rutinaDiaEjercicios)
            .set({
              ejercicioId: ej.ejercicio_id,
              orden,
            })
            .where(eq(rutinaDiaEjercicios.id, ej.rutinaDiaEjercicioId));

          ejDbId = ej.rutinaDiaEjercicioId;
          idsEnFormEj.add(ejDbId);

          await tx
            .delete(rutinaDiaEjercicioSeries)
            .where(eq(rutinaDiaEjercicioSeries.rutinaDiaEjercicioId, ejDbId));
        } else {
          const [nuevoEj] = await tx
            .insert(rutinaDiaEjercicios)
            .values({
              rutinaDiaId: rutinaDiaDbId,
              ejercicioId: ej.ejercicio_id,
              orden,
            })
            .returning({ id: rutinaDiaEjercicios.id });
          ejDbId = nuevoEj.id;
          idsEnFormEj.add(ejDbId);
        }

        for (let k = 0; k < ej.series.length; k++) {
          const serie = ej.series[k];
          await tx.insert(rutinaDiaEjercicioSeries).values({
            rutinaDiaEjercicioId: ejDbId,
            serieOrden: k + 1,
            repsObjetivo: serie.reps_objetivo?.toString() || "0",
            pesoObjetivo: serie.peso_objetivo?.toString() || "0",
          });
        }
      }

      for (const e of existentes) {
        if (!idsEnFormEj.has(e.id)) {
          await tx.delete(rutinaDiaEjercicios).where(eq(rutinaDiaEjercicios.id, e.id));
        }
      }
    };

    for (let i = 0; i < formData.dias.length; i++) {
      const dia = formData.dias[i];
      const orden = i + 1;
      let diaDbId: number;

      if (dia.rutinaDiaId != null && idsExistentesSet.has(dia.rutinaDiaId)) {
        await tx
          .update(rutinaDias)
          .set({ nombre: dia.nombre, orden })
          .where(eq(rutinaDias.id, dia.rutinaDiaId));
        diaDbId = dia.rutinaDiaId;
        idsEnFormulario.add(dia.rutinaDiaId);
      } else {
        const [nuevoDia] = await tx
          .insert(rutinaDias)
          .values({
            rutinaId: idFormateado,
            nombre: dia.nombre,
            orden,
          })
          .returning({ id: rutinaDias.id });
        diaDbId = nuevoDia.id;
      }

      await syncEjerciciosDia(diaDbId, dia.ejercicios);
    }

    for (const d of diasExistentes) {
      if (!idsEnFormulario.has(d.id)) {
        await tx.delete(rutinaDias).where(eq(rutinaDias.id, d.id));
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
        rutinaDiaId: row.diaId,
        nombre: row.diaNombre,
        ejercicios: [],
      };
      diasMap.set(row.diaId, nuevoDia);
      formRutina.dias.push(nuevoDia);
    }

    // Crear el ejercicio si no existe (clave = fila en rutina_dia_ejercicios, no el id del catálogo)
    if (row.rutinaDiaEjercicioId != null && !ejMap.has(row.rutinaDiaEjercicioId)) {
      const nuevoEj = {
        id_temp: Math.random().toString(),
        rutinaDiaEjercicioId: row.rutinaDiaEjercicioId,
        ejercicio_id: row.ejercicioMaestroId ?? null,
        ejercicio_nombre: row.ejercicioNombre ?? undefined,
        series: [],
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