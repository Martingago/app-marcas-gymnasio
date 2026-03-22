import { sqliteTable, integer, real } from "drizzle-orm/sqlite-core";
import { entrenamientos } from "./entrenamientos";
import { ejercicios } from "./ejercicios";

export const series = sqliteTable("series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entrenamientoId: integer("entrenamiento_id").references(() => entrenamientos.id, { onDelete: "cascade" }),
  ejercicioId: integer("ejercicio_id").references(() => ejercicios.id, { onDelete: "cascade" }),
  peso: real("peso").notNull(),
  repeticiones: integer("repeticiones").notNull(),
  esDropset: integer("es_dropset").default(0), // 0: false, 1: true
});