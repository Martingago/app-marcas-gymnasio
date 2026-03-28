import { db } from "@/database";
import { entrenamientos } from "@/db/schema/entrenamientos";
import { series } from "@/db/schema/series";
import { rutinaDias } from "@/db/schema/rutina/rutinaDias";
import { rutinas } from "@/db/schema/rutina/rutina";
import { ejercicios } from "@/db/schema/ejercicios";
import { eq, asc, desc, sql, and, gt, max } from "drizzle-orm";

/** Fecha local YYYY-MM-DD (sesión = un día de calendario) */
export const fechaLocalHoy = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Una sesión por (día de rutina + fecha). Se crea al abrir el entreno o al registrar la primera serie.
 */
export const getOrCreateEntrenamientoDelDia = async (
  rutinaDiaId: number,
  fechaYYYYMMDD?: string
): Promise<number> => {
  const fecha = (fechaYYYYMMDD ?? fechaLocalHoy()).slice(0, 10);

  const existente = await db
    .select({ id: entrenamientos.id })
    .from(entrenamientos)
    .where(and(eq(entrenamientos.rutinaDiaId, rutinaDiaId), eq(entrenamientos.fecha, fecha)))
    .limit(1);

  if (existente[0]) return existente[0].id;

  const [dia] = await db
    .select({ rutinaId: rutinaDias.rutinaId, nombre: rutinaDias.nombre })
    .from(rutinaDias)
    .where(eq(rutinaDias.id, rutinaDiaId));

  if (!dia || dia.rutinaId == null) {
    throw new Error("Día de rutina no encontrado");
  }

  const [ins] = await db
    .insert(entrenamientos)
    .values({
      fecha,
      rutinaDiaId,
      rutinaId: dia.rutinaId,
      nombreSnapshot: dia.nombre,
    })
    .returning({ id: entrenamientos.id });

  return ins.id;
};

export type SerieRealizadaRow = {
  id: number;
  ejercicioId: number;
  serieOrden: number;
  repeticiones: number;
  peso: number;
};

export const getSeriesDelEntrenamiento = async (
  entrenamientoId: number
): Promise<SerieRealizadaRow[]> => {
  const rows = await db
    .select({
      id: series.id,
      ejercicioId: series.ejercicioId,
      serieOrden: series.serieOrden,
      repeticiones: series.repeticiones,
      peso: series.peso,
    })
    .from(series)
    .where(eq(series.entrenamientoId, entrenamientoId))
    .orderBy(asc(series.ejercicioId), asc(series.serieOrden));

  return rows.map((r) => ({
    id: r.id,
    ejercicioId: r.ejercicioId!,
    serieOrden: r.serieOrden,
    repeticiones: r.repeticiones,
    peso: r.peso,
  }));
};

/** Añade una serie ya realizada (guardado inmediato, una fila) */
export const añadirSerieAlEntrenamiento = async (
  entrenamientoId: number,
  ejercicioId: number,
  valores?: { repeticiones?: number; peso?: number }
): Promise<number> => {
  const [agg] = await db
    .select({ m: max(series.serieOrden) })
    .from(series)
    .where(and(eq(series.entrenamientoId, entrenamientoId), eq(series.ejercicioId, ejercicioId)));

  const siguienteOrden = (Number(agg?.m) || 0) + 1;
  const reps = valores?.repeticiones ?? 10;
  const peso = valores?.peso ?? 0;

  const [row] = await db
    .insert(series)
    .values({
      entrenamientoId,
      ejercicioId,
      serieOrden: siguienteOrden,
      repeticiones: reps,
      peso,
      esDropset: 0,
    })
    .returning({ id: series.id });

  return row.id;
};

export const actualizarSerieRealizada = async (
  serieId: number,
  repeticiones: number,
  peso: number
): Promise<void> => {
  await db
    .update(series)
    .set({ repeticiones, peso })
    .where(eq(series.id, serieId));
};

export const eliminarSerieRealizada = async (serieId: number): Promise<void> => {
  await db.delete(series).where(eq(series.id, serieId));
};

export interface HistorialEjercicioFila {
  id: number;
  fecha: string;
  rutinaNombre: string;
  diaNombre: string | null;
  reps: number;
  peso: number;
  serieOrden: number;
}

export const getHistorialPorEjercicio = async (
  ejercicioId: number,
  limite = 200
): Promise<HistorialEjercicioFila[]> => {
  const rows = await db
    .select({
      sid: series.id,
      fecha: entrenamientos.fecha,
      rutinaNombre: rutinas.nombre,
      diaNombre: sql<string | null>`COALESCE(${rutinaDias.nombre}, ${entrenamientos.nombreSnapshot})`,
      reps: series.repeticiones,
      peso: series.peso,
      serieOrden: series.serieOrden,
    })
    .from(series)
    .innerJoin(entrenamientos, eq(series.entrenamientoId, entrenamientos.id))
    .leftJoin(rutinaDias, eq(entrenamientos.rutinaDiaId, rutinaDias.id))
    .leftJoin(
      rutinas,
      sql`${rutinas.id} = COALESCE(${entrenamientos.rutinaId}, ${rutinaDias.rutinaId})`
    )
    .where(eq(series.ejercicioId, ejercicioId))
    .orderBy(desc(entrenamientos.fecha), desc(entrenamientos.id), asc(series.serieOrden))
    .limit(limite);

  return rows.map((r) => ({
    id: r.sid,
    fecha: r.fecha,
    rutinaNombre: r.rutinaNombre ?? "—",
    diaNombre: r.diaNombre,
    reps: r.reps,
    peso: r.peso,
    serieOrden: r.serieOrden,
  }));
};

export interface SesionRutinaResumen {
  entrenamientoId: number;
  fecha: string;
  diaNombre: string | null;
  rutinaNombre: string;
}

export const getHistorialSesionesPorRutina = async (
  rutinaId: number
): Promise<SesionRutinaResumen[]> => {
  const rows = await db
    .select({
      entrenamientoId: entrenamientos.id,
      fecha: entrenamientos.fecha,
      diaNombre: sql<string | null>`COALESCE(${rutinaDias.nombre}, ${entrenamientos.nombreSnapshot})`,
      rutinaNombre: rutinas.nombre,
    })
    .from(entrenamientos)
    .innerJoin(rutinas, eq(entrenamientos.rutinaId, rutinas.id))
    .leftJoin(rutinaDias, eq(entrenamientos.rutinaDiaId, rutinaDias.id))
    .where(
      and(
        eq(entrenamientos.rutinaId, rutinaId),
        sql`EXISTS (SELECT 1 FROM series WHERE series.entrenamiento_id = ${entrenamientos.id})`
      )
    )
    .orderBy(desc(entrenamientos.fecha), desc(entrenamientos.id));

  return rows.map((r) => ({
    entrenamientoId: r.entrenamientoId,
    fecha: r.fecha,
    diaNombre: r.diaNombre,
    rutinaNombre: r.rutinaNombre ?? "—",
  }));
};

export const getDetalleSesion = async (entrenamientoId: number) => {
  const cab = await db
    .select({
      id: entrenamientos.id,
      fecha: entrenamientos.fecha,
      diaNombre: sql<string | null>`COALESCE(${rutinaDias.nombre}, ${entrenamientos.nombreSnapshot})`,
      rutinaNombre: rutinas.nombre,
    })
    .from(entrenamientos)
    .leftJoin(rutinaDias, eq(entrenamientos.rutinaDiaId, rutinaDias.id))
    .leftJoin(
      rutinas,
      sql`${rutinas.id} = COALESCE(${entrenamientos.rutinaId}, ${rutinaDias.rutinaId})`
    )
    .where(eq(entrenamientos.id, entrenamientoId))
    .limit(1);

  const sets = await db
    .select({
      ejercicioNombre: ejercicios.nombre,
      reps: series.repeticiones,
      peso: series.peso,
      serieOrden: series.serieOrden,
    })
    .from(series)
    .innerJoin(ejercicios, eq(series.ejercicioId, ejercicios.id))
    .where(eq(series.entrenamientoId, entrenamientoId))
    .orderBy(asc(ejercicios.id), asc(series.serieOrden));

  return { cabecera: cab[0] ?? null, series: sets };
};

/** Próximo día sugerido según el último entreno registrado de esa rutina */
export const getProximoDiaSugerido = async (rutinaId: number) => {
  const ultimo = await db
    .select({ rutinaDiaId: entrenamientos.rutinaDiaId })
    .from(entrenamientos)
    .innerJoin(rutinaDias, eq(entrenamientos.rutinaDiaId, rutinaDias.id))
    .where(eq(rutinaDias.rutinaId, rutinaId))
    .orderBy(desc(entrenamientos.fecha), desc(entrenamientos.id))
    .limit(1);

  if (ultimo.length === 0 || !ultimo[0].rutinaDiaId) {
    const [r] = await db
      .select()
      .from(rutinaDias)
      .where(eq(rutinaDias.rutinaId, rutinaId))
      .orderBy(asc(rutinaDias.orden))
      .limit(1);
    return r ?? null;
  }

  const lastId = ultimo[0].rutinaDiaId;
  const [diaActual] = await db.select().from(rutinaDias).where(eq(rutinaDias.id, lastId)).limit(1);

  if (!diaActual) {
    const [r] = await db
      .select()
      .from(rutinaDias)
      .where(eq(rutinaDias.rutinaId, rutinaId))
      .orderBy(asc(rutinaDias.orden))
      .limit(1);
    return r ?? null;
  }

  const [proximo] = await db
    .select()
    .from(rutinaDias)
    .where(and(eq(rutinaDias.rutinaId, rutinaId), gt(rutinaDias.orden, diaActual.orden)))
    .orderBy(asc(rutinaDias.orden))
    .limit(1);

  if (proximo) return proximo;

  const [primero] = await db
    .select()
    .from(rutinaDias)
    .where(eq(rutinaDias.rutinaId, rutinaId))
    .orderBy(asc(rutinaDias.orden))
    .limit(1);
  return primero ?? null;
};
