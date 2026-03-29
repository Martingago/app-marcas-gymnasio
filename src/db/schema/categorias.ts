import { sqliteTable, integer, text, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  /** Padre jerárquico (ej. Brazo → Bíceps). null = categoría de primer nivel */
  parentId: integer("parent_id").references((): AnySQLiteColumn => categorias.id, { onDelete: "set null" }),
});
