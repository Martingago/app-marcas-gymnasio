import { sqliteTable, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { entrenamientos } from "./entrenamientos";

/** UI del entreno en curso: ejercicios plegados en la pantalla de sesión. Ausencia de fila = expandido. */
export const entrenamientoEjercicioUi = sqliteTable(
  "entrenamiento_ejercicio_ui",
  {
    entrenamientoId: integer("entrenamiento_id")
      .notNull()
      .references(() => entrenamientos.id, { onDelete: "cascade" }),
    ejercicioId: integer("ejercicio_id").notNull(),
    /** 1 = plegado; 0 = expandido (compatibilidad import: por defecto mostrar contenido). */
    minimizado: integer("minimizado").notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.entrenamientoId, table.ejercicioId] }),
  })
);
