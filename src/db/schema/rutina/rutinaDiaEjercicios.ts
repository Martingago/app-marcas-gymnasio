// src/db/schema/rutina_dia_ejercicios.ts
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { ejercicios } from "../ejercicios";
import { relations } from "drizzle-orm";
import { rutinaDiaEjercicioSeries } from "./rutinaDiaEjerciciosSeries";
import { rutinaDias } from "@/db/schema/rutina/rutinaDias";


export const rutinaDiaEjercicios = sqliteTable("rutina_dia_ejercicios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rutinaDiaId: integer("rutina_dia_id").references(() => rutinaDias.id, { onDelete: "cascade" }),
  ejercicioId: integer("ejercicio_id").references(() => ejercicios.id, { onDelete: "cascade" }),
  orden: integer("orden").notNull(),
});

// Definimos la relación para que Drizzle sepa que un ejercicio tiene muchas series
export const rutinaDiaEjerciciosRelations = relations(rutinaDiaEjercicios, ({ many }) => ({
  series: many(rutinaDiaEjercicioSeries),
}));