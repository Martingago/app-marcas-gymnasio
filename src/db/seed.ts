import { db } from "@/database";
import { categorias } from "@/db/schema/categorias";
import { ejercicios } from "@/db/schema/ejercicios";
import { count } from "drizzle-orm";

export const seedDatabase = async () => {
  try {
    // 1. Comprobamos si ya existen categorías
    const resultado = await db.select({ valor: count() }).from(categorias);
    const numeroCategorias = resultado[0].valor;

    if (numeroCategorias > 0) {
      console.log("La base de datos ya tiene datos. Omitiendo la carga inicial (Seed).");
      return;
    }

    console.log("🌱 Base de datos vacía. Insertando datos por defecto...");

    // 2. Insertamos las categorías y pedimos que nos devuelva las filas creadas
    // Así sabremos qué ID le ha asignado SQLite a cada una.
    const categoriasInsertadas = await db
      .insert(categorias)
      .values([
        { nombre: "Pecho" },
        { nombre: "Espalda" },
        { nombre: "Pierna" },
        { nombre: "Hombro" },
        { nombre: "Brazo" },
        { nombre: "Core" },
        { nombre: "Cardio" },
      ])
      .returning({ id: categorias.id, nombre: categorias.nombre });

    // 3. Creamos un "diccionario" (mapa) para buscar fácilmente el ID por el nombre
    // Ej: mapaCategorias["Pecho"] nos dará un 1
    const mapaCategorias = categoriasInsertadas.reduce((acc, cat) => {
      acc[cat.nombre] = cat.id;
      return acc;
    }, {} as Record<string, number>);

    // 4. Preparamos una lista de ejercicios básicos usando los IDs correctos
    const ejerciciosPorDefecto =[
      // Pecho
      { nombre: "Press de Banca Plano", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Press Inclinado con Mancuernas", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Aperturas en Polea", categoriaId: mapaCategorias["Pecho"] },
      // Espalda
      { nombre: "Dominadas", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Remo con Barra", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Jalón al Pecho", categoriaId: mapaCategorias["Espalda"] },
      // Pierna
      { nombre: "Sentadilla con Barra", categoriaId: mapaCategorias["Pierna"] },
      { nombre: "Prensa Inclinada", categoriaId: mapaCategorias["Pierna"] },
      { nombre: "Peso Muerto Rumano", categoriaId: mapaCategorias["Pierna"] },
      { nombre: "Extensión de Cuádriceps", categoriaId: mapaCategorias["Pierna"] },
      // Hombro
      { nombre: "Press Militar", categoriaId: mapaCategorias["Hombro"] },
      { nombre: "Elevaciones Laterales", categoriaId: mapaCategorias["Hombro"] },
      { nombre: "Pájaros en Máquina", categoriaId: mapaCategorias["Hombro"] },
      // Brazo
      { nombre: "Curl de Bíceps con Barra", categoriaId: mapaCategorias["Brazo"] },
      { nombre: "Curl Martillo", categoriaId: mapaCategorias["Brazo"] },
      { nombre: "Extensión de Tríceps en Polea", categoriaId: mapaCategorias["Brazo"] },
      { nombre: "Press Francés", categoriaId: mapaCategorias["Brazo"] },
      // Core
      { nombre: "Crunch Abdominal", categoriaId: mapaCategorias["Core"] },
      { nombre: "Plancha", categoriaId: mapaCategorias["Core"] },
      // Cardio
      { nombre: "Cinta de Correr", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "Bicicleta Estática", categoriaId: mapaCategorias["Cardio"] },
    ];

    // 5. Insertamos todos los ejercicios de golpe (Bulk Insert)
    await db.insert(ejercicios).values(ejerciciosPorDefecto);

    console.log("✅ Datos por defecto insertados correctamente.");
  } catch (error) {
    console.error("❌ Error durante el seeding de la base de datos:", error);
  }
};