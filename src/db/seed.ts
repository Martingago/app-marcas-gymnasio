import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { count } from "drizzle-orm";

import * as schema from "@/db/schema";
import { categorias } from "@/db/schema/categorias";
import { ejercicios } from "@/db/schema/ejercicios";

export const seedDatabase = async (database: ExpoSQLiteDatabase<typeof schema>) => {
  try {
    // 1. Comprobamos si ya existen categorías
    const resultado = await database.select({ valor: count() }).from(categorias);
    const numeroCategorias = resultado[0].valor;

    if (numeroCategorias > 0) {
      console.log("La base de datos ya tiene datos. Omitiendo la carga inicial (Seed).");
      return;
    }

    console.log("🌱 Base de datos vacía. Insertando datos por defecto...");

    // 2. Insertamos las categorías más detalladas por grupos musculares
    const categoriasInsertadas = await database
      .insert(categorias)
      .values([
        { nombre: "Pecho" },
        { nombre: "Espalda" },
        { nombre: "Hombros" },
        { nombre: "Bíceps" },
        { nombre: "Tríceps" },
        { nombre: "Antebrazos" },
        { nombre: "Cuádriceps" },
        { nombre: "Femorales" },
        { nombre: "Glúteos" },
        { nombre: "Gemelos" },
        { nombre: "Core" },
        { nombre: "Cardio" },
        { nombre: "Cuerpo Completo" }
      ])
      .returning({ id: categorias.id, nombre: categorias.nombre });

    // 3. Creamos un diccionario (mapa) para buscar fácilmente el ID por el nombre
    const mapaCategorias = categoriasInsertadas.reduce((acc, cat) => {
      acc[cat.nombre] = cat.id;
      return acc;
    }, {} as Record<string, number>);

    // 4. Preparamos la lista exhaustiva de ejercicios
    const ejerciciosPorDefecto =[
      // ================= PECHO =================
      { nombre: "Press de Banca Plano con Barra", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Press de Banca Inclinado con Barra", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Press de Banca Declinado con Barra", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Press Plano con Mancuernas", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Press Inclinado con Mancuernas", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Press Declinado con Mancuernas", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Aperturas Planas con Mancuernas", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Aperturas Inclinadas con Mancuernas", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Aperturas en Máquina (Pec Deck)", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Cruces de Poleas (Altas/Medias/Bajas)", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Pullover con Mancuerna", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Press de Pecho en Máquina Convergente", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Flexiones de pecho (Push-ups)", categoriaId: mapaCategorias["Pecho"] },
      { nombre: "Fondos en Paralelas (Inclinado para Pecho)", categoriaId: mapaCategorias["Pecho"] },

      // ================= ESPALDA =================
      { nombre: "Dominadas (Pull-ups)", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Dominadas Supinas (Chin-ups)", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Jalón al Pecho", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Jalón al Pecho Agarre Estrecho/Neutro", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Remo con Barra", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Remo Pendlay", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Remo con Mancuerna a Una Mano", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Remo en Punta (T-Bar Row)", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Remo en Polea Baja", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Remo en Máquina (Machine Row)", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Pullover en Polea Alta con Cuerda", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Hiperextensiones (Silla Romana)", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Peso Muerto Tradicional", categoriaId: mapaCategorias["Espalda"] },
      { nombre: "Rack Pulls", categoriaId: mapaCategorias["Espalda"] },

      // ================= HOMBROS =================
      { nombre: "Press Militar con Barra (De pie)", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Press de Hombros Sentado con Barra", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Press de Hombros con Mancuernas", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Press Arnold", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Press de Hombros en Máquina", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Elevaciones Laterales con Mancuernas", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Elevaciones Laterales en Polea", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Elevaciones Laterales en Máquina", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Elevaciones Frontales (Barra/Mancuerna/Disco)", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Elevaciones Frontales en Polea", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Pájaros con Mancuernas (Inclinado)", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Pájaros en Máquina (Rear Delt Fly)", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Face Pull en Polea", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Remo al Cuello (Upright Row)", categoriaId: mapaCategorias["Hombros"] },
      { nombre: "Encogimientos de Hombros (Trapecios)", categoriaId: mapaCategorias["Hombros"] },

      // ================= BÍCEPS =================
      { nombre: "Curl de Bíceps con Barra Recta", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl de Bíceps con Barra EZ", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl Alterno con Mancuernas", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl Martillo con Mancuernas", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl Martillo en Polea (Cuerda)", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl Predicador (Banco Scott)", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl Concentrado", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl Araña (Spider Curl)", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl en Polea Baja", categoriaId: mapaCategorias["Bíceps"] },
      { nombre: "Curl Bayesian en Polea", categoriaId: mapaCategorias["Bíceps"] },

      // ================= TRÍCEPS =================
      { nombre: "Extensión de Tríceps en Polea (Cuerda)", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Extensión de Tríceps en Polea (Barra Recta/V)", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Press Francés con Barra EZ", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Extensión Tras Nuca con Mancuerna", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Extensión Tras Nuca en Polea", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Press de Banca Agarre Cerrado", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Patada de Tríceps (Kickback)", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Fondos de Tríceps en Banco", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "Fondos en Paralelas (Dips)", categoriaId: mapaCategorias["Tríceps"] },
      { nombre: "JM Press", categoriaId: mapaCategorias["Tríceps"] },

      // ================= ANTEBRAZOS =================
      { nombre: "Curl de Muñeca en Supinación", categoriaId: mapaCategorias["Antebrazos"] },
      { nombre: "Curl de Muñeca en Pronación", categoriaId: mapaCategorias["Antebrazos"] },
      { nombre: "Curl Zottman", categoriaId: mapaCategorias["Antebrazos"] },
      { nombre: "Paseo del Granjero (Farmer's Walk)", categoriaId: mapaCategorias["Antebrazos"] },
      { nombre: "Rodillo de Muñeca (Wrist Roller)", categoriaId: mapaCategorias["Antebrazos"] },

      // ================= CUÁDRICEPS =================
      { nombre: "Sentadilla Libre con Barra (Back Squat)", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Sentadilla Frontal (Front Squat)", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Prensa de Piernas (Leg Press)", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Sentadilla Hack en Máquina", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Sentadilla Búlgara", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Zancadas / Estocadas (Lunges)", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Zancadas Caminando", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Extensión de Cuádriceps en Máquina", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Sentadilla Goblet con Pesa Rusa/Mancuerna", categoriaId: mapaCategorias["Cuádriceps"] },
      { nombre: "Sentadilla Sissy", categoriaId: mapaCategorias["Cuádriceps"] },

      // ================= FEMORALES (ISQUIOSURALES) =================
      { nombre: "Peso Muerto Rumano (RDL)", categoriaId: mapaCategorias["Femorales"] },
      { nombre: "Peso Muerto con Piernas Rígidas", categoriaId: mapaCategorias["Femorales"] },
      { nombre: "Curl de Piernas Tumbado (Lying Leg Curl)", categoriaId: mapaCategorias["Femorales"] },
      { nombre: "Curl de Piernas Sentado (Seated Leg Curl)", categoriaId: mapaCategorias["Femorales"] },
      { nombre: "Curl de Piernas de Pie a Una Pierna", categoriaId: mapaCategorias["Femorales"] },
      { nombre: "Buenos Días (Good Mornings)", categoriaId: mapaCategorias["Femorales"] },
      { nombre: "Glute Ham Raise (GHR)", categoriaId: mapaCategorias["Femorales"] },
      { nombre: "Curl Nórdico", categoriaId: mapaCategorias["Femorales"] },

      // ================= GLÚTEOS =================
      { nombre: "Hip Thrust con Barra", categoriaId: mapaCategorias["Glúteos"] },
      { nombre: "Puente de Glúteos (Glute Bridge)", categoriaId: mapaCategorias["Glúteos"] },
      { nombre: "Patada de Glúteo en Polea", categoriaId: mapaCategorias["Glúteos"] },
      { nombre: "Patada de Glúteo en Máquina", categoriaId: mapaCategorias["Glúteos"] },
      { nombre: "Abducción de Cadera en Máquina", categoriaId: mapaCategorias["Glúteos"] },
      { nombre: "Aducción de Cadera en Máquina", categoriaId: mapaCategorias["Glúteos"] },
      { nombre: "Sentadilla Sumo", categoriaId: mapaCategorias["Glúteos"] },
      { nombre: "Pull Through en Polea Baja", categoriaId: mapaCategorias["Glúteos"] },

      // ================= GEMELOS =================
      { nombre: "Elevación de Talones de Pie (Máquina/Barra)", categoriaId: mapaCategorias["Gemelos"] },
      { nombre: "Elevación de Talones Sentado (Máquina)", categoriaId: mapaCategorias["Gemelos"] },
      { nombre: "Elevación de Talones en Prensa de Piernas", categoriaId: mapaCategorias["Gemelos"] },
      { nombre: "Elevación de Talones Tipo Burro (Donkey Calf Raise)", categoriaId: mapaCategorias["Gemelos"] },

      // ================= CORE / ABDOMINALES =================
      { nombre: "Crunch Abdominal", categoriaId: mapaCategorias["Core"] },
      { nombre: "Crunch Abdominal en Polea", categoriaId: mapaCategorias["Core"] },
      { nombre: "Elevación de Piernas Colgado (Hanging Leg Raises)", categoriaId: mapaCategorias["Core"] },
      { nombre: "Elevación de Rodillas Colgado", categoriaId: mapaCategorias["Core"] },
      { nombre: "Elevación de Piernas Tumbado", categoriaId: mapaCategorias["Core"] },
      { nombre: "Plancha Abdominal (Plank)", categoriaId: mapaCategorias["Core"] },
      { nombre: "Plancha Lateral", categoriaId: mapaCategorias["Core"] },
      { nombre: "Rueda Abdominal (Ab Wheel)", categoriaId: mapaCategorias["Core"] },
      { nombre: "Giro Ruso (Russian Twist)", categoriaId: mapaCategorias["Core"] },
      { nombre: "Leñador en Polea (Woodchopper)", categoriaId: mapaCategorias["Core"] },
      { nombre: "Dragon Flag", categoriaId: mapaCategorias["Core"] },
      { nombre: "Toes to Bar (Pies a la Barra)", categoriaId: mapaCategorias["Core"] },
      { nombre: "V-Ups (Abdominales en V)", categoriaId: mapaCategorias["Core"] },

      // ================= CARDIO =================
      { nombre: "Cinta de Correr", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "Bicicleta Estática", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "Bicicleta Elíptica", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "Máquina de Remo (Ergómetro)", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "Escaladora (Stairmaster)", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "Assault Bike / Air Bike", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "SkiErg", categoriaId: mapaCategorias["Cardio"] },
      { nombre: "Saltos a la Comba", categoriaId: mapaCategorias["Cardio"] },

      // ================= CUERPO COMPLETO / HALTEROFILIA =================
      { nombre: "Burpees", categoriaId: mapaCategorias["Cuerpo Completo"] },
      { nombre: "Kettlebell Swing", categoriaId: mapaCategorias["Cuerpo Completo"] },
      { nombre: "Arrancada (Snatch)", categoriaId: mapaCategorias["Cuerpo Completo"] },
      { nombre: "Dos Tiempos (Clean & Jerk)", categoriaId: mapaCategorias["Cuerpo Completo"] },
      { nombre: "Cargada de Potencia (Power Clean)", categoriaId: mapaCategorias["Cuerpo Completo"] },
      { nombre: "Push Press", categoriaId: mapaCategorias["Cuerpo Completo"] },
      { nombre: "Thruster", categoriaId: mapaCategorias["Cuerpo Completo"] }
    ];

    // 5. Insertamos todos los ejercicios de golpe (Bulk Insert)
    // Al ser un array grande, SQLite con Drizzle lo inserta eficientemente en una sola transacción
    await database.insert(ejercicios).values(ejerciciosPorDefecto);

    console.log("✅ Datos por defecto insertados correctamente (" + ejerciciosPorDefecto.length + " ejercicios).");
  } catch (error) {
    console.error("❌ Error durante el seeding de la base de datos:", error);
  }
};