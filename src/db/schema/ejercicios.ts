import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { categorias } from "./categorias";

export const ejercicios = sqliteTable("ejercicios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  categoriaId: integer("categoria_id").references(() => categorias.id, { onDelete: "set null" }),
});