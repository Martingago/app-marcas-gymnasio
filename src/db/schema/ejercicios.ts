import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const ejercicios = sqliteTable("ejercicios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
});
