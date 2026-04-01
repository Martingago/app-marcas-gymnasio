import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { db, sqliteDb } from "@/database";
import * as schema from "@/db/schema";

export const BACKUP_FORMAT = "nextpr-backup" as const;
export const BACKUP_JSON_VERSION = 1;

const SQLITE_TABLES_DELETE_ORDER = [
  "series",
  "entrenamiento_ejercicio_ui",
  "entrenamientos",
  "rutina_dia_ejercicio_series",
  "rutina_dia_ejercicios",
  "rutina_dias",
  "rutinas",
  "ejercicio_categorias",
  "ejercicios",
  "categorias",
] as const;

type TablesSnapshot = {
  categorias: (typeof schema.categorias.$inferSelect)[];
  ejercicios: (typeof schema.ejercicios.$inferSelect)[];
  ejercicio_categorias: (typeof schema.ejercicioCategorias.$inferSelect)[];
  rutinas: (typeof schema.rutinas.$inferSelect)[];
  rutina_dias: (typeof schema.rutinaDias.$inferSelect)[];
  rutina_dia_ejercicios: (typeof schema.rutinaDiaEjercicios.$inferSelect)[];
  rutina_dia_ejercicio_series: (typeof schema.rutinaDiaEjercicioSeries.$inferSelect)[];
  entrenamientos: (typeof schema.entrenamientos.$inferSelect)[];
  series: (typeof schema.series.$inferSelect)[];
  entrenamiento_ejercicio_ui: (typeof schema.entrenamientoEjercicioUi.$inferSelect)[];
};

export type NextPRBackupPayload = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  drizzleMetaVersion: string;
  tables: TablesSnapshot;
};

const CHUNK = 200;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n);
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

function isNumOrNull(v: unknown): v is number | null {
  return v === null || (typeof v === "number" && Number.isFinite(v));
}

function validateRows(
  name: keyof TablesSnapshot,
  rows: unknown,
  check: (row: Record<string, unknown>, i: number) => string | null
): string | null {
  if (!Array.isArray(rows)) return `La tabla «${name}» debe ser un array.`;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!isRecord(row)) return `Fila inválida en «${name}» (#${i + 1}).`;
    const err = check(row, i);
    if (err) return err;
  }
  return null;
}

export function validateBackupPayload(raw: unknown): { ok: true; data: NextPRBackupPayload } | { ok: false; message: string } {
  if (!isRecord(raw)) return { ok: false, message: "El archivo no es un JSON de copia válido." };
  if (raw.format !== BACKUP_FORMAT) return { ok: false, message: "Este archivo no es una copia de NextPR (formato incorrecto)." };
  if (!isInt(raw.version) || raw.version < 1 || raw.version > BACKUP_JSON_VERSION) {
    return { ok: false, message: "Versión de copia no compatible con esta app. Actualiza la aplicación." };
  }
  if (!isStr(raw.exportedAt)) return { ok: false, message: "Falta la fecha de exportación en la copia." };
  if (!isStr(raw.drizzleMetaVersion)) return { ok: false, message: "Falta metadato de esquema en la copia." };
  if (!isRecord(raw.tables)) return { ok: false, message: "Falta el bloque de tablas en la copia." };
  const t = raw.tables as Record<string, unknown>;

  const need: (keyof TablesSnapshot)[] = [
    "categorias",
    "ejercicios",
    "ejercicio_categorias",
    "rutinas",
    "rutina_dias",
    "rutina_dia_ejercicios",
    "rutina_dia_ejercicio_series",
    "entrenamientos",
    "series",
  ];
  for (const k of need) {
    if (!(k in t)) return { ok: false, message: `Falta la tabla «${k}» en la copia.` };
  }

  let err: string | null;

  err = validateRows("categorias", t.categorias, (row) => {
    if (!isInt(row.id)) return "categorias.id debe ser entero.";
    if (!isStr(row.nombre) || !row.nombre.trim()) return "categorias.nombre inválido.";
    if (row.parentId !== undefined && row.parentId !== null && !isInt(row.parentId)) return "categorias.parentId inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("ejercicios", t.ejercicios, (row) => {
    if (!isInt(row.id)) return "ejercicios.id debe ser entero.";
    if (!isStr(row.nombre) || !row.nombre.trim()) return "ejercicios.nombre inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("ejercicio_categorias", t.ejercicio_categorias, (row) => {
    if (!isInt(row.ejercicioId)) return "ejercicio_categorias.ejercicioId inválido.";
    if (!isInt(row.categoriaId)) return "ejercicio_categorias.categoriaId inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("rutinas", t.rutinas, (row) => {
    if (!isInt(row.id)) return "rutinas.id inválido.";
    if (!isStr(row.nombre)) return "rutinas.nombre inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("rutina_dias", t.rutina_dias, (row) => {
    if (!isInt(row.id)) return "rutina_dias.id inválido.";
    if (!isNumOrNull(row.rutinaId)) return "rutina_dias.rutinaId inválido.";
    if (!isStr(row.nombre)) return "rutina_dias.nombre inválido.";
    if (!isInt(row.orden)) return "rutina_dias.orden inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("rutina_dia_ejercicios", t.rutina_dia_ejercicios, (row) => {
    if (!isInt(row.id)) return "rutina_dia_ejercicios.id inválido.";
    if (!isNumOrNull(row.rutinaDiaId)) return "rutina_dia_ejercicios.rutinaDiaId inválido.";
    if (!isNumOrNull(row.ejercicioId)) return "rutina_dia_ejercicios.ejercicioId inválido.";
    if (!isInt(row.orden)) return "rutina_dia_ejercicios.orden inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("rutina_dia_ejercicio_series", t.rutina_dia_ejercicio_series, (row) => {
    if (!isInt(row.id)) return "rutina_dia_ejercicio_series.id inválido.";
    if (!isNumOrNull(row.rutinaDiaEjercicioId)) return "rutina_dia_ejercicio_series.rutinaDiaEjercicioId inválido.";
    if (!isInt(row.serieOrden)) return "rutina_dia_ejercicio_series.serieOrden inválido.";
    if (row.repsObjetivo != null && row.repsObjetivo !== undefined && !isStr(row.repsObjetivo)) return "repsObjetivo inválido.";
    if (row.pesoObjetivo != null && row.pesoObjetivo !== undefined && !isStr(row.pesoObjetivo)) return "pesoObjetivo inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("entrenamientos", t.entrenamientos, (row) => {
    if (!isInt(row.id)) return "entrenamientos.id inválido.";
    if (!isStr(row.fecha)) return "entrenamientos.fecha inválida.";
    if (!isNumOrNull(row.rutinaDiaId)) return "entrenamientos.rutinaDiaId inválido.";
    if (!isNumOrNull(row.rutinaId)) return "entrenamientos.rutinaId inválido.";
    if (row.nombreSnapshot != null && row.nombreSnapshot !== undefined && !isStr(row.nombreSnapshot)) return "nombreSnapshot inválido.";
    if (!isInt(row.finalizado)) return "entrenamientos.finalizado inválido.";
    if (row.finalizadoEn != null && row.finalizadoEn !== undefined && !isStr(row.finalizadoEn)) return "finalizadoEn inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  err = validateRows("series", t.series, (row) => {
    if (!isInt(row.id)) return "series.id inválido.";
    if (!isNumOrNull(row.entrenamientoId)) return "series.entrenamientoId inválido.";
    if (!isNumOrNull(row.ejercicioId)) return "series.ejercicioId inválido.";
    if (!isInt(row.serieOrden)) return "series.serieOrden inválido.";
    if (typeof row.peso !== "number" || !Number.isFinite(row.peso)) return "series.peso inválido.";
    if (!isInt(row.repeticiones)) return "series.repeticiones inválido.";
    if (row.esDropset != null && row.esDropset !== undefined && !isInt(row.esDropset)) return "series.esDropset inválido.";
    return null;
  });
  if (err) return { ok: false, message: err };

  let entrenamiento_ejercicio_ui: TablesSnapshot["entrenamiento_ejercicio_ui"] = [];
  if ("entrenamiento_ejercicio_ui" in t && t.entrenamiento_ejercicio_ui != null) {
    err = validateRows(
      "entrenamiento_ejercicio_ui",
      t.entrenamiento_ejercicio_ui,
      (row) => {
        if (!isInt(row.entrenamientoId)) return "entrenamiento_ejercicio_ui: entrenamientoId inválido.";
        if (!isInt(row.ejercicioId)) return "entrenamiento_ejercicio_ui: ejercicioId inválido.";
        if (row.minimizado !== undefined && row.minimizado !== null) {
          if (!isInt(row.minimizado)) return "entrenamiento_ejercicio_ui: minimizado inválido.";
          if (row.minimizado !== 0 && row.minimizado !== 1) return "entrenamiento_ejercicio_ui: minimizado debe ser 0 o 1.";
        }
        return null;
      }
    );
    if (err) return { ok: false, message: err };
    entrenamiento_ejercicio_ui = (t.entrenamiento_ejercicio_ui as Record<string, unknown>[]).map((row) => ({
      entrenamientoId: row.entrenamientoId as number,
      ejercicioId: row.ejercicioId as number,
      minimizado: (isInt(row.minimizado) ? row.minimizado : 0) as number,
    }));
  }

  const tabCore = t as unknown as Omit<TablesSnapshot, "entrenamiento_ejercicio_ui">;
  const data: NextPRBackupPayload = {
    format: raw.format as typeof BACKUP_FORMAT,
    version: raw.version as number,
    exportedAt: raw.exportedAt as string,
    drizzleMetaVersion: raw.drizzleMetaVersion as string,
    tables: {
      categorias: tabCore.categorias,
      ejercicios: tabCore.ejercicios,
      ejercicio_categorias: tabCore.ejercicio_categorias,
      rutinas: tabCore.rutinas,
      rutina_dias: tabCore.rutina_dias,
      rutina_dia_ejercicios: tabCore.rutina_dia_ejercicios,
      rutina_dia_ejercicio_series: tabCore.rutina_dia_ejercicio_series,
      entrenamientos: tabCore.entrenamientos,
      series: tabCore.series,
      entrenamiento_ejercicio_ui,
    },
  };

  const fk = validateReferentialIntegrity(data.tables);
  if (fk) return { ok: false, message: fk };

  try {
    const sorted = sortCategoriasForInsert(data.tables.categorias);
    if (sorted.length !== data.tables.categorias.length) {
      return { ok: false, message: "Árbol de categorías inválido (referencias rotas)." };
    }
  } catch {
    return { ok: false, message: "Ciclo detectado en la jerarquía de categorías." };
  }

  return { ok: true, data };
}

function validateReferentialIntegrity(tab: TablesSnapshot): string | null {
  const catIds = new Set(tab.categorias.map((c) => c.id));
  const ejIds = new Set(tab.ejercicios.map((e) => e.id));
  const rutIds = new Set(tab.rutinas.map((r) => r.id));
  const diaIds = new Set(tab.rutina_dias.map((d) => d.id));
  const rdeIds = new Set(tab.rutina_dia_ejercicios.map((x) => x.id));
  const entIds = new Set(tab.entrenamientos.map((e) => e.id));

  for (const c of tab.categorias) {
    if (c.parentId != null && !catIds.has(c.parentId)) {
      return `La categoría ${c.id} referencia un parentId inexistente (${c.parentId}).`;
    }
  }
  for (const ec of tab.ejercicio_categorias) {
    if (!ejIds.has(ec.ejercicioId)) return `ejercicio_categorias referencia ejercicioId ${ec.ejercicioId} inexistente.`;
    if (!catIds.has(ec.categoriaId)) return `ejercicio_categorias referencia categoriaId ${ec.categoriaId} inexistente.`;
  }
  for (const d of tab.rutina_dias) {
    if (d.rutinaId != null && !rutIds.has(d.rutinaId)) {
      return `rutina_dias ${d.id} referencia rutinaId ${d.rutinaId} inexistente.`;
    }
  }
  for (const x of tab.rutina_dia_ejercicios) {
    if (x.rutinaDiaId != null && !diaIds.has(x.rutinaDiaId)) {
      return `rutina_dia_ejercicios ${x.id} referencia rutinaDiaId inexistente.`;
    }
    if (x.ejercicioId != null && !ejIds.has(x.ejercicioId)) {
      return `rutina_dia_ejercicios ${x.id} referencia ejercicioId inexistente.`;
    }
  }
  for (const s of tab.rutina_dia_ejercicio_series) {
    if (s.rutinaDiaEjercicioId != null && !rdeIds.has(s.rutinaDiaEjercicioId)) {
      return `rutina_dia_ejercicio_series referencia rutinaDiaEjercicioId inexistente.`;
    }
  }
  for (const e of tab.entrenamientos) {
    if (e.rutinaDiaId != null && !diaIds.has(e.rutinaDiaId)) {
      return `entrenamientos ${e.id} referencia rutinaDiaId inexistente.`;
    }
    if (e.rutinaId != null && !rutIds.has(e.rutinaId)) {
      return `entrenamientos ${e.id} referencia rutinaId inexistente.`;
    }
  }
  for (const s of tab.series) {
    if (s.entrenamientoId != null && !entIds.has(s.entrenamientoId)) {
      return `series ${s.id} referencia entrenamientoId inexistente.`;
    }
    if (s.ejercicioId != null && !ejIds.has(s.ejercicioId)) {
      return `series ${s.id} referencia ejercicioId inexistente.`;
    }
  }
  for (const u of tab.entrenamiento_ejercicio_ui) {
    if (!entIds.has(u.entrenamientoId)) {
      return `entrenamiento_ejercicio_ui referencia entrenamientoId ${u.entrenamientoId} inexistente.`;
    }
    if (!ejIds.has(u.ejercicioId)) {
      return `entrenamiento_ejercicio_ui referencia ejercicioId ${u.ejercicioId} inexistente.`;
    }
  }
  return null;
}

function sortCategoriasForInsert(rows: TablesSnapshot["categorias"]): TablesSnapshot["categorias"] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: TablesSnapshot["categorias"] = [];
  const visiting = new Set<number>();
  const done = new Set<number>();

  function visit(id: number) {
    if (done.has(id)) return;
    const r = byId.get(id);
    if (!r) return;
    if (visiting.has(id)) throw new Error("cycle");
    visiting.add(id);
    if (r.parentId != null && byId.has(r.parentId)) visit(r.parentId);
    visiting.delete(id);
    done.add(id);
    out.push(r);
  }
  for (const r of rows) visit(r.id);
  return out;
}

function clearUserTablesSync() {
  const stmts = ["PRAGMA foreign_keys = OFF;"];
  for (const name of SQLITE_TABLES_DELETE_ORDER) {
    stmts.push(`DELETE FROM ${name};`);
  }
  stmts.push("PRAGMA foreign_keys = ON;");
  sqliteDb.execSync(stmts.join("\n"));
}

async function insertInChunks<T extends Record<string, unknown>>(
  rows: T[],
  run: (batch: T[]) => Promise<unknown>
) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK) as T[];
    if (batch.length) await run(batch);
  }
}

export async function exportBackupJson(): Promise<string> {
  const [
    categorias,
    ejercicios,
    ejercicio_categorias,
    rutinas,
    rutina_dias,
    rutina_dia_ejercicios,
    rutina_dia_ejercicio_series,
    entrenamientos,
    series,
    entrenamiento_ejercicio_ui,
  ] = await Promise.all([
    db.select().from(schema.categorias),
    db.select().from(schema.ejercicios),
    db.select().from(schema.ejercicioCategorias),
    db.select().from(schema.rutinas),
    db.select().from(schema.rutinaDias),
    db.select().from(schema.rutinaDiaEjercicios),
    db.select().from(schema.rutinaDiaEjercicioSeries),
    db.select().from(schema.entrenamientos),
    db.select().from(schema.series),
    db.select().from(schema.entrenamientoEjercicioUi),
  ]);

  const payload: NextPRBackupPayload = {
    format: BACKUP_FORMAT,
    version: BACKUP_JSON_VERSION,
    exportedAt: new Date().toISOString(),
    drizzleMetaVersion: "7",
    tables: {
      categorias,
      ejercicios,
      ejercicio_categorias,
      rutinas,
      rutina_dias,
      rutina_dia_ejercicios,
      rutina_dia_ejercicio_series,
      entrenamientos,
      series,
      entrenamiento_ejercicio_ui,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export async function exportAndShareBackup(): Promise<void> {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error("documentDirectory no disponible en esta plataforma.");

  const name = `nextpr-copia-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`;
  const path = `${base}${name}`;
  const json = await exportBackupJson();
  await FileSystem.writeAsStringAsync(path, json, { encoding: "utf8" });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: "application/json",
      dialogTitle: "Guardar copia NextPR",
      UTI: "public.json",
    });
  }
}

export async function pickAndReadBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const uri = res.assets[0].uri;
  return FileSystem.readAsStringAsync(uri, { encoding: "utf8" });
}

function normalizeSerieRow(r: TablesSnapshot["series"][number]): typeof r {
  return {
    ...r,
    esDropset: r.esDropset ?? 0,
  };
}

function normalizeRutinaSerieRow(r: TablesSnapshot["rutina_dia_ejercicio_series"][number]) {
  return {
    ...r,
    repsObjetivo: r.repsObjetivo ?? "10",
    pesoObjetivo: r.pesoObjetivo ?? "0",
  };
}

function normalizeEntrenoUiRow(r: TablesSnapshot["entrenamiento_ejercicio_ui"][number]) {
  return {
    ...r,
    minimizado: r.minimizado ?? 0,
  };
}

export async function importBackupPayload(payload: NextPRBackupPayload): Promise<void> {
  const tab = payload.tables;
  const categoriasSorted = sortCategoriasForInsert(tab.categorias);

  clearUserTablesSync();

  await db.transaction(async (tx) => {
    await insertInChunks(categoriasSorted as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.categorias).values(batch as TablesSnapshot["categorias"])
    );
    await insertInChunks(tab.ejercicios as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.ejercicios).values(batch as TablesSnapshot["ejercicios"])
    );
    await insertInChunks(tab.ejercicio_categorias as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.ejercicioCategorias).values(batch as TablesSnapshot["ejercicio_categorias"])
    );
    await insertInChunks(tab.rutinas as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.rutinas).values(batch as TablesSnapshot["rutinas"])
    );
    await insertInChunks(tab.rutina_dias as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.rutinaDias).values(batch as TablesSnapshot["rutina_dias"])
    );
    await insertInChunks(tab.rutina_dia_ejercicios as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.rutinaDiaEjercicios).values(batch as TablesSnapshot["rutina_dia_ejercicios"])
    );
    const seriesNorm = tab.rutina_dia_ejercicio_series.map(normalizeRutinaSerieRow);
    await insertInChunks(seriesNorm as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.rutinaDiaEjercicioSeries).values(batch as TablesSnapshot["rutina_dia_ejercicio_series"])
    );
    await insertInChunks(tab.entrenamientos as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.entrenamientos).values(batch as TablesSnapshot["entrenamientos"])
    );
    const uiRows = tab.entrenamiento_ejercicio_ui.map(normalizeEntrenoUiRow);
    if (uiRows.length) {
      await insertInChunks(uiRows as unknown as Record<string, unknown>[], (batch) =>
        tx.insert(schema.entrenamientoEjercicioUi).values(batch as TablesSnapshot["entrenamiento_ejercicio_ui"])
      );
    }
    const seriesRows = tab.series.map(normalizeSerieRow);
    await insertInChunks(seriesRows as unknown as Record<string, unknown>[], (batch) =>
      tx.insert(schema.series).values(batch as TablesSnapshot["series"])
    );
  });
}

export function parseBackupJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("No se pudo leer el JSON (archivo corrupto o no es texto JSON).");
  }
}
