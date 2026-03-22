import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const rutinas = sqliteTable("rutinas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
});