import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations"; // Se genera automáticamente
import * as schema from "./db/schema";
import { seedDatabase } from "./db/seed";

// Conexión nativa (exportada para backup / mantenimiento)
export const sqliteDb = SQLite.openDatabaseSync("gymData.db");
// ON DELETE CASCADE y demás FK solo se aplican con foreign_keys activado (SQLite).
sqliteDb.execSync("PRAGMA foreign_keys = ON;");
// Instancia de Drizzle
export const db = drizzle(sqliteDb, { schema });


/**
 * Función de inicialización 
 */
export const initDB = async () => {

  try {
    // Lee la carpeta /drizzle y crea/actualiza las tablas por ti.
    await migrate(db, migrations);
    
    console.log("✅ Tablas sincronizadas con éxito (Drizzle Migrations)");

    // Datos huérfanos (p. ej. ejercicio borrado sin FK activas): evita export/import incoherentes
    try {
      sqliteDb.execSync(
        "DELETE FROM ejercicio_categorias WHERE ejercicio_id NOT IN (SELECT id FROM ejercicios);"
      );
    } catch {
      /* tabla aún no existe en primera arrancada muy temprana */
    }

    // Llena la base de datos con información por defecto si está vacía
    await seedDatabase(db);

    // Opcional: Insertar categorías por defecto si la tabla está vacía
    // Veremos cómo hacer esto con Drizzle en el siguiente paso de los Services
  } catch (error) {
    console.error("❌ Error al sincronizar las tablas:", error);
  }
};

