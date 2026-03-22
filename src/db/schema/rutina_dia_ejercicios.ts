import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { rutinaDias } from "./rutina_dias";
import { ejercicios } from "./ejercicios";

export const rutinaDiaEjercicios = sqliteTable("rutina_dia_ejercicios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rutinaDiaId: integer("rutina_dia_id").references(() => rutinaDias.id, { onDelete: "cascade" }),
  ejercicioId: integer("ejercicio_id").references(() => ejercicios.id, { onDelete: "cascade" }),
  seriesObjetivo: integer("series_objetivo").default(3),
  repsObjetivo: text("reps_objetivo").default("10"),
  orden: integer("orden").notNull(),
});