import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
});