// src/db/schema/rutina_dia_ejercicios.ts
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { ejercicios } from "../ejercicios";
import { rutinaDias } from "@/db/schema/rutina/rutinaDias";

export const rutinaDiaEjercicios = sqliteTable("rutina_dia_ejercicios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rutinaDiaId: integer("rutina_dia_id").references(() => rutinaDias.id, { onDelete: "cascade" }),
  ejercicioId: integer("ejercicio_id").references(() => ejercicios.id, { onDelete: "cascade" }),
  orden: integer("orden").notNull(),
});