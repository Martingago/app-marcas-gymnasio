import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { rutinaDias } from "./rutina_dias";

export const entrenamientos = sqliteTable("entrenamientos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fecha: text("fecha").notNull(), // Formato ISO YYYY-MM-DD
  rutinaDiaId: integer("rutina_dia_id").references(() => rutinaDias.id, { onDelete: "set null" }),
  nombreSnapshot: text("nombre_snapshot"), // Backup del nombre del día
});