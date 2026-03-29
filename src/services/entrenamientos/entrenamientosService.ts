import { db } from "@/database";
import { entrenamientos } from "@/db/schema/entrenamientos";
import { series } from "@/db/schema/series";
import { rutinaDias } from "@/db/schema/rutina/rutinaDias";
import { rutinas } from "@/db/schema/rutina/rutina";
import { ejercicios } from "@/db/schema/ejercicios";
import { eq, asc, desc, sql, and, gt, max, or, isNull } from "drizzle-orm";

/** Ya hay un entreno sin finalizar en otro día de la misma rutina */
export const ERROR_OTRO_DIA_ACTIVO = "ERROR_OTRO_DIA_ACTIVO";

export function esErrorOtroDiaActivo(e: unknown): boolean {
  return e instanceof Error && e.message === ERROR_OTRO_DIA_ACTIVO;
}

export const fechaLocalHoy = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isoAhora = () => new Date().toISOString();

/** Si hubiera más de un entreno activo (legacy), deja solo el más reciente por id */
async function consolidarEntrenosActivosDuplicados(rutinaId: number): Promise<void> {
  const activos = await db
    .select()
    .from(entrenamientos)
    .where(and(eq(entrenamientos.rutinaId, rutinaId), eq(entrenamientos.finalizado, 0)))
    .orderBy(desc(entrenamientos.id));

  if (activos.length <= 1) return;

  const [, ...cerrar] = activos;
  for (const row of cerrar) {
    await db
      .update(entrenamientos)
      .set({ finalizado: 1, finalizadoEn: isoAhora() })
      .where(eq(entrenamientos.id, row.id));
  }
}

export type EntrenoActivoInfo = {
  id: number;
  rutinaDiaId: number | null;
  nombreDia: string | null;
};

/** Entreno abierto (no finalizado) para la rutina, como mucho uno */
export const getEntrenoActivoRutina = async (rutinaId: number): Promise<EntrenoActivoInfo | null> => {
  await consolidarEntrenosActivosDuplicados(rutinaId);

  const rows = await db
    .select({
      id: entrenamientos.id,
      rutinaDiaId: entrenamientos.rutinaDiaId,
      nombreSnapshot: entrenamientos.nombreSnapshot,
      nombreDiaJoin: rutinaDias.nombre,
    })
    .from(entrenamientos)
    .leftJoin(rutinaDias, eq(entrenamientos.rutinaDiaId, rutinaDias.id))
    .where(and(eq(entrenamientos.rutinaId, rutinaId), eq(entrenamientos.finalizado, 0)))
    .orderBy(desc(entrenamientos.id))
    .limit(1);

  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    rutinaDiaId: r.rutinaDiaId,
    nombreDia: r.nombreDiaJoin ?? r.nombreSnapshot ?? null,
  };
};

/**
 * Una sola sesión activa por rutina. Si ya hay otra abierta en otro día, lanza ERROR_OTRO_DIA_ACTIVO.
 */
export const getOrCreateSesionActivaParaDia = async (rutinaDiaId: number): Promise<number> => {
  const [dia] = await db
    .select({ rutinaId: rutinaDias.rutinaId, nombre: rutinaDias.nombre })
    .from(rutinaDias)
    .where(eq(rutinaDias.id, rutinaDiaId));

  if (!dia?.rutinaId) {
    throw new Error("Día de rutina no encontrado");
  }

  await consolidarEntrenosActivosDuplicados(dia.rutinaId);

  const [activo] = await db
    .select()
    .from(entrenamientos)
    .where(and(eq(entrenamientos.rutinaId, dia.rutinaId), eq(entrenamientos.finalizado, 0)))
    .orderBy(desc(entrenamientos.id))
    .limit(1);

  if (activo) {
    if (activo.rutinaDiaId !== rutinaDiaId) {
      throw new Error(ERROR_OTRO_DIA_ACTIVO);
    }
    return activo.id;
  }

  const [ins] = await db
    .insert(entrenamientos)
    .values({
      fecha: fechaLocalHoy(),
      rutinaDiaId,
      rutinaId: dia.rutinaId,
      nombreSnapshot: dia.nombre,
      finalizado: 0,
    })
    .returning({ id: entrenamientos.id });

  return ins.id;
};

export type EntrenamientoCabecera = {
  id: number;
  fecha: string;
  finalizado: number;
  finalizadoEn: string | null;
  rutinaDiaId: number | null;
  rutinaId: number | null;
};

export const getEntrenamientoCabecera = async (
  entrenamientoId: number
): Promise<EntrenamientoCabecera | null> => {
  const rows = await db
    .select({
      id: entrenamientos.id,
      fecha: entrenamientos.fecha,
      finalizado: entrenamientos.finalizado,
      finalizadoEn: entrenamientos.finalizadoEn,
      rutinaDiaId: entrenamientos.rutinaDiaId,
      rutinaId: entrenamientos.rutinaId,
    })
    .from(entrenamientos)
    .where(eq(entrenamientos.id, entrenamientoId))
    .limit(1);

  return rows[0] ?? null;
};

export const finalizarEntrenamientoDia = async (entrenamientoId: number): Promise<void> => {
  await db
    .update(entrenamientos)
    .set({ finalizado: 1, finalizadoEn: isoAhora() })
    .where(and(eq(entrenamientos.id, entrenamientoId), eq(entrenamientos.finalizado, 0)));
};

export const eliminarEntrenamientoFinalizado = async (entrenamientoId: number): Promise<void> => {
  const cab = await getEntrenamientoCabecera(entrenamientoId);
  if (!cab || cab.finalizado !== 1) {
    throw new Error("Solo se puede eliminar un entreno ya finalizado");
  }
  await db.delete(entrenamientos).where(eq(entrenamientos.id, entrenamientoId));
};

/** Borra la sesión en curso (no finalizada) y sus series. El día recomendado vuelve a basarse solo en entrenos finalizados. */
export const cancelarEntrenamientoActivo = async (entrenamientoId: number): Promise<void> => {
  const cab = await getEntrenamientoCabecera(entrenamientoId);
  if (!cab || cab.finalizado !== 0) {
    throw new Error("Solo se puede cancelar un entreno en curso");
  }
  await db.delete(entrenamientos).where(eq(entrenamientos.id, entrenamientoId));
};

async function assertEntrenoEditable(entrenamientoId: number): Promise<void> {
  const [e] = await db
    .select({ finalizado: entrenamientos.finalizado })
    .from(entrenamientos)
    .where(eq(entrenamientos.id, entrenamientoId))
    .limit(1);
  if (!e) throw new Error("Entreno no encontrado");
  if (e.finalizado) throw new Error("SESION_FINALIZADA");
}

export type SerieRealizadaRow = {
  id: number;
  ejercicioId: number;
  serieOrden: number;
  repeticiones: number;
  peso: number;
  /** 0 = serie principal; 1 = dropset tras esa misma serieOrden */
  esDropset: number;
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
      esDropset: series.esDropset,
    })
    .from(series)
    .where(eq(series.entrenamientoId, entrenamientoId))
    .orderBy(asc(series.ejercicioId), asc(series.serieOrden), asc(series.esDropset), asc(series.id));

  return rows.map((r) => ({
    id: r.id,
    ejercicioId: r.ejercicioId!,
    serieOrden: r.serieOrden,
    repeticiones: r.repeticiones,
    peso: r.peso,
    esDropset: r.esDropset ?? 0,
  }));
};

export const añadirSerieAlEntrenamiento = async (
  entrenamientoId: number,
  ejercicioId: number,
  valores?: { repeticiones?: number; peso?: number; serieOrden?: number }
): Promise<number> => {
  await assertEntrenoEditable(entrenamientoId);

  const reps = valores?.repeticiones ?? 10;
  const peso = valores?.peso ?? 0;

  if (valores?.serieOrden != null) {
    const orden = valores.serieOrden;
    const [existe] = await db
      .select({ id: series.id })
      .from(series)
      .where(
        and(
          eq(series.entrenamientoId, entrenamientoId),
          eq(series.ejercicioId, ejercicioId),
          eq(series.serieOrden, orden),
          or(eq(series.esDropset, 0), isNull(series.esDropset))
        )
      )
      .limit(1);
    if (existe) return existe.id;

    const [row] = await db
      .insert(series)
      .values({
        entrenamientoId,
        ejercicioId,
        serieOrden: orden,
        repeticiones: reps,
        peso,
        esDropset: 0,
      })
      .returning({ id: series.id });
    return row.id;
  }

  const [agg] = await db
    .select({ m: max(series.serieOrden) })
    .from(series)
    .where(and(eq(series.entrenamientoId, entrenamientoId), eq(series.ejercicioId, ejercicioId)));

  const siguienteOrden = (Number(agg?.m) || 0) + 1;

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

/**
 * Añade un dropset con la misma `serieOrden` que la serie principal (mismo hueco de plantilla o serie extra).
 * Debe existir ya la fila principal (es_dropset = 0).
 */
export const añadirDropsetTrasSerie = async (
  entrenamientoId: number,
  ejercicioId: number,
  serieOrden: number,
  repeticiones: number,
  peso: number
): Promise<number> => {
  await assertEntrenoEditable(entrenamientoId);

  const [main] = await db
    .select({ id: series.id })
    .from(series)
    .where(
      and(
        eq(series.entrenamientoId, entrenamientoId),
        eq(series.ejercicioId, ejercicioId),
        eq(series.serieOrden, serieOrden),
        or(eq(series.esDropset, 0), isNull(series.esDropset))
      )
    )
    .limit(1);

  if (!main) {
    throw new Error("Registra primero la serie principal antes de añadir un dropset.");
  }

  const [row] = await db
    .insert(series)
    .values({
      entrenamientoId,
      ejercicioId,
      serieOrden,
      repeticiones,
      peso,
      esDropset: 1,
    })
    .returning({ id: series.id });

  if (!row) throw new Error("No se pudo insertar el dropset.");
  return row.id;
};

export const actualizarSerieRealizada = async (
  serieId: number,
  repeticiones: number,
  peso: number
): Promise<void> => {
  const [s] = await db
    .select({ entrenamientoId: series.entrenamientoId })
    .from(series)
    .where(eq(series.id, serieId))
    .limit(1);
  if (!s?.entrenamientoId) return;
  await assertEntrenoEditable(s.entrenamientoId);

  await db
    .update(series)
    .set({ repeticiones, peso })
    .where(eq(series.id, serieId));
};

export const eliminarSerieRealizada = async (serieId: number): Promise<void> => {
  const [s] = await db
    .select({ entrenamientoId: series.entrenamientoId })
    .from(series)
    .where(eq(series.id, serieId))
    .limit(1);
  if (!s?.entrenamientoId) return;
  await assertEntrenoEditable(s.entrenamientoId);

  await db.delete(series).where(eq(series.id, serieId));
};

export interface HistorialEjercicioFila {
  id: number;
  entrenamientoId: number;
  fecha: string;
  rutinaNombre: string;
  diaNombre: string | null;
  reps: number;
  peso: number;
  serieOrden: number;
  esDropset: number;
}

export const getHistorialPorEjercicio = async (
  ejercicioId: number,
  limite = 200
): Promise<HistorialEjercicioFila[]> => {
  const rows = await db
    .select({
      sid: series.id,
      entrenamientoId: entrenamientos.id,
      fecha: entrenamientos.fecha,
      rutinaNombre: rutinas.nombre,
      diaNombre: sql<string | null>`COALESCE(${rutinaDias.nombre}, ${entrenamientos.nombreSnapshot})`,
      reps: series.repeticiones,
      peso: series.peso,
      serieOrden: series.serieOrden,
      esDropset: series.esDropset,
    })
    .from(series)
    .innerJoin(entrenamientos, eq(series.entrenamientoId, entrenamientos.id))
    .leftJoin(rutinaDias, eq(entrenamientos.rutinaDiaId, rutinaDias.id))
    .leftJoin(
      rutinas,
      sql`${rutinas.id} = COALESCE(${entrenamientos.rutinaId}, ${rutinaDias.rutinaId})`
    )
    .where(and(eq(series.ejercicioId, ejercicioId), eq(entrenamientos.finalizado, 1)))
    .orderBy(
      desc(entrenamientos.fecha),
      desc(entrenamientos.id),
      asc(series.serieOrden),
      asc(series.esDropset),
      asc(series.id)
    )
    .limit(limite);

  return rows.map((r) => ({
    id: r.sid,
    entrenamientoId: r.entrenamientoId,
    fecha: r.fecha,
    rutinaNombre: r.rutinaNombre ?? "—",
    diaNombre: r.diaNombre,
    reps: r.reps,
    peso: r.peso,
    serieOrden: r.serieOrden,
    esDropset: r.esDropset ?? 0,
  }));
};

export type DetalleSesionSerie = {
  id: number;
  ejercicioId: number;
  ejercicioNombre: string;
  reps: number;
  peso: number;
  serieOrden: number;
  esDropset: number;
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
    .where(and(eq(entrenamientos.rutinaId, rutinaId), eq(entrenamientos.finalizado, 1)))
    .orderBy(
      desc(sql`COALESCE(${entrenamientos.finalizadoEn}, ${entrenamientos.fecha})`),
      desc(entrenamientos.id)
    );

  return rows.map((r) => ({
    entrenamientoId: r.entrenamientoId,
    fecha: r.fecha,
    diaNombre: r.diaNombre,
    rutinaNombre: r.rutinaNombre ?? "—",
  }));
};

/** Todos los entrenos finalizados del usuario (cualquier rutina), más recientes primero */
export const getHistorialSesionesTodos = async (): Promise<SesionRutinaResumen[]> => {
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
    .where(eq(entrenamientos.finalizado, 1))
    .orderBy(
      desc(sql`COALESCE(${entrenamientos.finalizadoEn}, ${entrenamientos.fecha})`),
      desc(entrenamientos.id)
    );

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
      finalizado: entrenamientos.finalizado,
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
      id: series.id,
      ejercicioId: ejercicios.id,
      ejercicioNombre: ejercicios.nombre,
      reps: series.repeticiones,
      peso: series.peso,
      serieOrden: series.serieOrden,
      esDropset: series.esDropset,
    })
    .from(series)
    .innerJoin(ejercicios, eq(series.ejercicioId, ejercicios.id))
    .where(eq(series.entrenamientoId, entrenamientoId))
    .orderBy(asc(ejercicios.id), asc(series.serieOrden), asc(series.esDropset), asc(series.id));

  return {
    cabecera: cab[0] ?? null,
    series: sets.map((r) => ({
      id: r.id,
      ejercicioId: r.ejercicioId,
      ejercicioNombre: r.ejercicioNombre,
      reps: r.reps,
      peso: r.peso,
      serieOrden: r.serieOrden,
      esDropset: r.esDropset ?? 0,
    })),
  };
};

/**
 * Siguiente día recomendado según el último entreno **finalizado** (orden lógico).
 * Si entrenó el día 3, recomienda el 4; si no hay finalizados, el primero.
 */
export const getProximoDiaSugerido = async (rutinaId: number) => {
  const ultimo = await db
    .select({ rutinaDiaId: entrenamientos.rutinaDiaId })
    .from(entrenamientos)
    .innerJoin(rutinaDias, eq(entrenamientos.rutinaDiaId, rutinaDias.id))
    .where(and(eq(rutinaDias.rutinaId, rutinaId), eq(entrenamientos.finalizado, 1)))
    .orderBy(
      desc(sql`COALESCE(${entrenamientos.finalizadoEn}, ${entrenamientos.fecha})`),
      desc(entrenamientos.id)
    )
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
