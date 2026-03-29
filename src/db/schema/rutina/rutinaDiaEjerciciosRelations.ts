import { relations } from "drizzle-orm";
import { rutinaDiaEjercicios } from "./rutinaDiaEjercicios";
import { rutinaDiaEjercicioSeries } from "./rutinaDiaEjerciciosSeries";

export const rutinaDiaEjerciciosRelations = relations(rutinaDiaEjercicios, ({ many }) => ({
  series: many(rutinaDiaEjercicioSeries),
}));
