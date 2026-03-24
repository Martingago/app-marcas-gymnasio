import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { rutinas } from "@/db/schema/rutina/rutina";

export const rutinaDias = sqliteTable("rutina_dias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rutinaId: integer("rutina_id").references(() => rutinas.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(), // Ej: "Día 1: Empuje"
  orden: integer("orden").notNull(),
});