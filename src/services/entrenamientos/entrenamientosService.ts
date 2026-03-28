import { db } from "@/database";
import { entrenamientos } from "@/db/schema/entrenamientos";
import { series } from "@/db/schema/series";
import { rutinaDias } from "@/db/schema/rutina/rutinaDias";
import { rutinas } from "@/db/schema/rutina/rutina";
import { ejercicios } from "@/db/schema/ejercicios";
import { eq, asc, desc, sql, and, gt } from "drizzle-orm";

export type SerieRegistrada = {
  ejercicioId: number;
  serieOrden: number;
  repeticiones: number;
  peso: number;
};

export const crearEntrenamientoConSeries = async (params: {
  rutinaDiaId: number;
  fechaISO: string;
  seriesRegistros: SerieRegistrada[];
}) => {
  const [dia] = await db
    .select({ rutinaId: rutinaDias.rutinaId, nombre: rutinaDias.nombre })
    .from(rutinaDias)
    .where(eq(rutinaDias.id, params.rutinaDiaId));

  if (!dia || dia.rutinaId == null) {
    throw new Error("Día de rutina no encontrado");
  }

  const fecha = params.fechaISO.slice(0, 10);

  await db.transaction(async (tx) => {
    const [ent] = await tx
      .insert(entrenamientos)
      .values({
        fecha,
        rutinaDiaId: params.rutinaDiaId,
        rutinaId: dia.rutinaId,
        nombreSnapshot: dia.nombre,
      })
      .returning({ id: entrenamientos.id });

    for (const s of params.seriesRegistros) {
      await tx.insert(series).values({
        entrenamientoId: ent.id,
        ejercicioId: s.ejercicioId,
        serieOrden: s.serieOrden,
        peso: s.peso,
        repeticiones: s.repeticiones,
        esDropset: 0,
      });
    }
  });
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
    .where(eq(entrenamientos.rutinaId, rutinaId))
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
