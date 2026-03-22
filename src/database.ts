import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations"; // Se genera automáticamente
import * as schema from "./db/schema";
import { seedDatabase } from "./db/seed";

// Conexión nativa
const expoDb = SQLite.openDatabaseSync("gymData.db");
// Instancia de Drizzle
export const db = drizzle(expoDb, { schema });


/**
 * Función de inicialización 
 */
export const initDB = async () => {

  try {
    // Lee la carpeta /drizzle y crea/actualiza las tablas por ti.
    await migrate(db, migrations);
    
    console.log("✅ Tablas sincronizadas con éxito (Drizzle Migrations)");

    // Llena la base de datos con información por defecto si está vacía
    await seedDatabase();

    // Opcional: Insertar categorías por defecto si la tabla está vacía
    // Veremos cómo hacer esto con Drizzle en el siguiente paso de los Services
  } catch (error) {
    console.error("❌ Error al sincronizar las tablas:", error);
  }
};

