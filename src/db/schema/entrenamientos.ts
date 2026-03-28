import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { rutinaDias } from "@/db/schema/rutina/rutinaDias";
import { rutinas } from "@/db/schema/rutina/rutina";

export const entrenamientos = sqliteTable("entrenamientos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fecha: text("fecha").notNull(), // Formato ISO YYYY-MM-DD
  rutinaDiaId: integer("rutina_dia_id").references(() => rutinaDias.id, { onDelete: "set null" }),
  /** Denormalizado: conserva el vínculo con la rutina si rutina_dia_id queda null */
  rutinaId: integer("rutina_id").references(() => rutinas.id, { onDelete: "set null" }),
  nombreSnapshot: text("nombre_snapshot"), // Backup del nombre del día
  /** 0 = sesión editable; 1 = día finalizado (solo lectura o eliminar entero) */
  finalizado: integer("finalizado").notNull().default(0),
  finalizadoEn: text("finalizado_en"), // ISO 8601 al cerrar el día
});