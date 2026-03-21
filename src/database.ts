import * as SQLite from "expo-sqlite";

// Abrimos (o creamos) la base de datos de forma local
const db = SQLite.openDatabaseSync("gymData.db");

export const initDB = () => {
  try {
    // Usamos execSync para ejecutar las consultas de creación de tablas
    db.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );

      INSERT OR IGNORE INTO categorias (nombre) VALUES 
      ('Pecho'), ('Espalda'), ('Pierna'), ('Hombro'), ('Brazo'), ('Core'), ('Cardio');
      

      CREATE TABLE IF NOT EXISTS ejercicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria_id INTEGER,
        FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS rutinas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rutina_ejercicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rutina_id INTEGER,
        ejercicio_id INTEGER,
        FOREIGN KEY(rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE,
        FOREIGN KEY(ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS entrenamientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        rutina_id INTEGER,
        FOREIGN KEY(rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entrenamiento_id INTEGER,
        ejercicio_id INTEGER,
        peso REAL,
        repeticiones INTEGER,
        es_dropset INTEGER DEFAULT 0,
        FOREIGN KEY(entrenamiento_id) REFERENCES entrenamientos(id) ON DELETE CASCADE,
        FOREIGN KEY(ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Base de datos inicializada correctamente");
  } catch (error) {
    console.error("❌ Error inicializando la base de datos", error);
  }
};

export default db;
