// src\db\schema\rutinaDiaEjerciciosSeries.ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { rutinaDiaEjercicios } from "./rutinaDiaEjercicios";

export const rutinaDiaEjercicioSeries = sqliteTable("rutina_dia_ejercicio_series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rutinaDiaEjercicioId: integer("rutina_dia_ejercicio_id").references(() => rutinaDiaEjercicios.id, { onDelete: "cascade" }),
  serieOrden: integer("serie_orden").notNull(), // Serie 1, Serie 2...
  repsObjetivo: text("reps_objetivo").default("10"), // Text por si ponen "8-10"
  pesoObjetivo: text("peso_objetivo").default("0"),  // Text por si ponen "RIR 2" o "80kg"
});