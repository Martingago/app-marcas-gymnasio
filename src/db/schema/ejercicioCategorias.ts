import { sqliteTable, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { ejercicios } from "./ejercicios";
import { categorias } from "./categorias";

/** Un ejercicio puede tener varias categorías (ej. Brazo + Tríceps) */
export const ejercicioCategorias = sqliteTable(
  "ejercicio_categorias",
  {
    ejercicioId: integer("ejercicio_id")
      .notNull()
      .references(() => ejercicios.id, { onDelete: "cascade" }),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ejercicioId, t.categoriaId] }),
  })
);
