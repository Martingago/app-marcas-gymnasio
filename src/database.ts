import * as SQLite from "expo-sqlite";

// Abrimos (o creamos) la base de datos de forma local
const db = SQLite.openDatabaseSync("gymData.db");

export const initDB = () => {
  try {
    // Usamos execSync para ejecutar las consultas de creación de tablas
    db.execSync(`
    PRAGMA journal_mode = WAL;

    -- 1. Categorías y Ejercicios (La base de conocimiento)
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS ejercicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria_id INTEGER,
      FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
    );

    -- 2. Estructura de Rutinas (El Mapa)
    CREATE TABLE IF NOT EXISTS rutinas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rutina_dias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rutina_id INTEGER,
      nombre TEXT NOT NULL, -- Ej: "Día 1: Empuje"
      orden INTEGER,        -- Para saber qué día va después de cuál
      FOREIGN KEY(rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rutina_dia_ejercicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rutina_dia_id INTEGER,
      ejercicio_id INTEGER,
      series_objetivo INTEGER DEFAULT 3,
      reps_objetivo TEXT DEFAULT '10', -- Texto por si quieres poner '8-12'
      orden INTEGER,
      FOREIGN KEY(rutina_dia_id) REFERENCES rutina_dias(id) ON DELETE CASCADE,
      FOREIGN KEY(ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
    );

    -- 3. Histórico (El Viaje - Los datos reales)
    CREATE TABLE IF NOT EXISTS entrenamientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      rutina_dia_id INTEGER, -- Guardamos qué día de rutina se usó como plantilla
      nombre_snapshot TEXT,  -- Opcional: Guardamos el nombre del día por si se borra la rutina
      FOREIGN KEY(rutina_dia_id) REFERENCES rutina_dias(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entrenamiento_id INTEGER,
      ejercicio_id INTEGER, -- REFERENCIA DIRECTA AL EJERCICIO (Independencia de la rutina)
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
