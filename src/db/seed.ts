import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { count } from "drizzle-orm";

import * as schema from "@/db/schema";
import { categorias } from "@/db/schema/categorias";
import { ejercicios } from "@/db/schema/ejercicios";
import { ejercicioCategorias } from "@/db/schema/ejercicioCategorias";

/** Añade categoría global Brazo / Pierna cuando el detalle es un hijo de esos grupos */
function nombresCategoriasParaEjercicio(detalle: string): string[] {
  const brazo = new Set(["Bíceps", "Tríceps", "Antebrazos"]);
  const pierna = new Set(["Cuádriceps", "Femorales", "Glúteos", "Gemelos"]);
  if (brazo.has(detalle)) return ["Brazo", detalle];
  if (pierna.has(detalle)) return ["Pierna", detalle];
  return [detalle];
}

export const seedDatabase = async (database: ExpoSQLiteDatabase<typeof schema>) => {
  try {
    const resultado = await database.select({ valor: count() }).from(categorias);
    const numeroCategorias = resultado[0].valor;

    if (numeroCategorias > 0) {
      console.log("La base de datos ya tiene datos. Omitiendo la carga inicial (Seed).");
      return;
    }

    console.log("🌱 Base de datos vacía. Insertando datos por defecto...");

    const nombresRaiz = [
      "Pecho",
      "Espalda",
      "Hombros",
      "Brazo",
      "Pierna",
      "Core",
      "Cardio",
      "Cuerpo completo",
    ];

    const raices = await database
      .insert(categorias)
      .values(nombresRaiz.map((nombre) => ({ nombre, parentId: null })))
      .returning({ id: categorias.id, nombre: categorias.nombre });

    const idPorNombre = (nombre: string) => raices.find((r) => r.nombre === nombre)?.id;
    const idBrazo = idPorNombre("Brazo");
    const idPierna = idPorNombre("Pierna");

    if (idBrazo == null || idPierna == null) {
      throw new Error("Seed: faltan categorías raíz Brazo o Pierna");
    }

    const hijos = await database
      .insert(categorias)
      .values([
        { nombre: "Bíceps", parentId: idBrazo },
        { nombre: "Tríceps", parentId: idBrazo },
        { nombre: "Antebrazos", parentId: idBrazo },
        { nombre: "Cuádriceps", parentId: idPierna },
        { nombre: "Femorales", parentId: idPierna },
        { nombre: "Glúteos", parentId: idPierna },
        { nombre: "Gemelos", parentId: idPierna },
      ])
      .returning({ id: categorias.id, nombre: categorias.nombre });

    const mapaCategorias: Record<string, number> = {};
    for (const c of [...raices, ...hijos]) {
      mapaCategorias[c.nombre] = c.id;
    }

    const ejerciciosDetalle: { nombre: string; detalle: string }[] = [
      // PECHO
      { nombre: "Press de Banca Plano con Barra", detalle: "Pecho" },
      { nombre: "Press de Banca Inclinado con Barra", detalle: "Pecho" },
      { nombre: "Press de Banca Declinado con Barra", detalle: "Pecho" },
      { nombre: "Press Plano con Mancuernas", detalle: "Pecho" },
      { nombre: "Press Inclinado con Mancuernas", detalle: "Pecho" },
      { nombre: "Press Declinado con Mancuernas", detalle: "Pecho" },
      { nombre: "Aperturas Planas con Mancuernas", detalle: "Pecho" },
      { nombre: "Aperturas Inclinadas con Mancuernas", detalle: "Pecho" },
      { nombre: "Aperturas en Máquina (Pec Deck)", detalle: "Pecho" },
      { nombre: "Cruces de Poleas (Altas/Medias/Bajas)", detalle: "Pecho" },
      { nombre: "Pullover con Mancuerna", detalle: "Pecho" },
      { nombre: "Press de Pecho en Máquina Convergente", detalle: "Pecho" },
      { nombre: "Flexiones de pecho (Push-ups)", detalle: "Pecho" },
      { nombre: "Fondos en Paralelas (Inclinado para Pecho)", detalle: "Pecho" },

      // ESPALDA
      { nombre: "Dominadas (Pull-ups)", detalle: "Espalda" },
      { nombre: "Dominadas Supinas (Chin-ups)", detalle: "Espalda" },
      { nombre: "Jalón al Pecho", detalle: "Espalda" },
      { nombre: "Jalón al Pecho Agarre Estrecho/Neutro", detalle: "Espalda" },
      { nombre: "Remo con Barra", detalle: "Espalda" },
      { nombre: "Remo Pendlay", detalle: "Espalda" },
      { nombre: "Remo con Mancuerna a Una Mano", detalle: "Espalda" },
      { nombre: "Remo en Punta (T-Bar Row)", detalle: "Espalda" },
      { nombre: "Remo en Polea Baja", detalle: "Espalda" },
      { nombre: "Remo en Máquina (Machine Row)", detalle: "Espalda" },
      { nombre: "Pullover en Polea Alta con Cuerda", detalle: "Espalda" },
      { nombre: "Hiperextensiones (Silla Romana)", detalle: "Espalda" },
      { nombre: "Peso Muerto Tradicional", detalle: "Espalda" },
      { nombre: "Rack Pulls", detalle: "Espalda" },

      // HOMBROS
      { nombre: "Press Militar con Barra (De pie)", detalle: "Hombros" },
      { nombre: "Press de Hombros Sentado con Barra", detalle: "Hombros" },
      { nombre: "Press de Hombros con Mancuernas", detalle: "Hombros" },
      { nombre: "Press Arnold", detalle: "Hombros" },
      { nombre: "Press de Hombros en Máquina", detalle: "Hombros" },
      { nombre: "Elevaciones Laterales con Mancuernas", detalle: "Hombros" },
      { nombre: "Elevaciones Laterales en Polea", detalle: "Hombros" },
      { nombre: "Elevaciones Laterales en Máquina", detalle: "Hombros" },
      { nombre: "Elevaciones Frontales (Barra/Mancuerna/Disco)", detalle: "Hombros" },
      { nombre: "Elevaciones Frontales en Polea", detalle: "Hombros" },
      { nombre: "Pájaros con Mancuernas (Inclinado)", detalle: "Hombros" },
      { nombre: "Pájaros en Máquina (Rear Delt Fly)", detalle: "Hombros" },
      { nombre: "Face Pull en Polea", detalle: "Hombros" },
      { nombre: "Remo al Cuello (Upright Row)", detalle: "Hombros" },
      { nombre: "Encogimientos de Hombros (Trapecios)", detalle: "Hombros" },

      // BÍCEPS
      { nombre: "Curl de Bíceps con Barra Recta", detalle: "Bíceps" },
      { nombre: "Curl de Bíceps con Barra EZ", detalle: "Bíceps" },
      { nombre: "Curl Alterno con Mancuernas", detalle: "Bíceps" },
      { nombre: "Curl Martillo con Mancuernas", detalle: "Bíceps" },
      { nombre: "Curl Martillo en Polea (Cuerda)", detalle: "Bíceps" },
      { nombre: "Curl Predicador (Banco Scott)", detalle: "Bíceps" },
      { nombre: "Curl Concentrado", detalle: "Bíceps" },
      { nombre: "Curl Araña (Spider Curl)", detalle: "Bíceps" },
      { nombre: "Curl en Polea Baja", detalle: "Bíceps" },
      { nombre: "Curl Bayesian en Polea", detalle: "Bíceps" },

      // TRÍCEPS
      { nombre: "Extensión de Tríceps en Polea (Cuerda)", detalle: "Tríceps" },
      { nombre: "Extensión de Tríceps en Polea (Barra Recta/V)", detalle: "Tríceps" },
      { nombre: "Press Francés con Barra EZ", detalle: "Tríceps" },
      { nombre: "Extensión Tras Nuca con Mancuerna", detalle: "Tríceps" },
      { nombre: "Extensión Tras Nuca en Polea", detalle: "Tríceps" },
      { nombre: "Press de Banca Agarre Cerrado", detalle: "Tríceps" },
      { nombre: "Patada de Tríceps (Kickback)", detalle: "Tríceps" },
      { nombre: "Fondos de Tríceps en Banco", detalle: "Tríceps" },
      { nombre: "Fondos en Paralelas (Dips)", detalle: "Tríceps" },
      { nombre: "JM Press", detalle: "Tríceps" },

      // ANTEBRAZOS
      { nombre: "Curl de Muñeca en Supinación", detalle: "Antebrazos" },
      { nombre: "Curl de Muñeca en Pronación", detalle: "Antebrazos" },
      { nombre: "Curl Zottman", detalle: "Antebrazos" },
      { nombre: "Paseo del Granjero (Farmer's Walk)", detalle: "Antebrazos" },
      { nombre: "Rodillo de Muñeca (Wrist Roller)", detalle: "Antebrazos" },

      // CUÁDRICEPS
      { nombre: "Sentadilla Libre con Barra (Back Squat)", detalle: "Cuádriceps" },
      { nombre: "Sentadilla Frontal (Front Squat)", detalle: "Cuádriceps" },
      { nombre: "Prensa de Piernas (Leg Press)", detalle: "Cuádriceps" },
      { nombre: "Sentadilla Hack en Máquina", detalle: "Cuádriceps" },
      { nombre: "Sentadilla Búlgara", detalle: "Cuádriceps" },
      { nombre: "Zancadas / Estocadas (Lunges)", detalle: "Cuádriceps" },
      { nombre: "Zancadas Caminando", detalle: "Cuádriceps" },
      { nombre: "Extensión de Cuádriceps en Máquina", detalle: "Cuádriceps" },
      { nombre: "Sentadilla Goblet con Pesa Rusa/Mancuerna", detalle: "Cuádriceps" },
      { nombre: "Sentadilla Sissy", detalle: "Cuádriceps" },

      // FEMORALES
      { nombre: "Peso Muerto Rumano (RDL)", detalle: "Femorales" },
      { nombre: "Peso Muerto con Piernas Rígidas", detalle: "Femorales" },
      { nombre: "Curl de Piernas Tumbado (Lying Leg Curl)", detalle: "Femorales" },
      { nombre: "Curl de Piernas Sentado (Seated Leg Curl)", detalle: "Femorales" },
      { nombre: "Curl de Piernas de Pie a Una Pierna", detalle: "Femorales" },
      { nombre: "Buenos Días (Good Mornings)", detalle: "Femorales" },
      { nombre: "Glute Ham Raise (GHR)", detalle: "Femorales" },
      { nombre: "Curl Nórdico", detalle: "Femorales" },

      // GLÚTEOS
      { nombre: "Hip Thrust con Barra", detalle: "Glúteos" },
      { nombre: "Puente de Glúteos (Glute Bridge)", detalle: "Glúteos" },
      { nombre: "Patada de Glúteo en Polea", detalle: "Glúteos" },
      { nombre: "Patada de Glúteo en Máquina", detalle: "Glúteos" },
      { nombre: "Abducción de Cadera en Máquina", detalle: "Glúteos" },
      { nombre: "Aducción de Cadera en Máquina", detalle: "Glúteos" },
      { nombre: "Sentadilla Sumo", detalle: "Glúteos" },
      { nombre: "Pull Through en Polea Baja", detalle: "Glúteos" },

      // GEMELOS
      { nombre: "Elevación de Talones de Pie (Máquina/Barra)", detalle: "Gemelos" },
      { nombre: "Elevación de Talones Sentado (Máquina)", detalle: "Gemelos" },
      { nombre: "Elevación de Talones en Prensa de Piernas", detalle: "Gemelos" },
      { nombre: "Elevación de Talones Tipo Burro (Donkey Calf Raise)", detalle: "Gemelos" },

      // CORE
      { nombre: "Crunch Abdominal", detalle: "Core" },
      { nombre: "Crunch Abdominal en Polea", detalle: "Core" },
      { nombre: "Elevación de Piernas Colgado (Hanging Leg Raises)", detalle: "Core" },
      { nombre: "Elevación de Rodillas Colgado", detalle: "Core" },
      { nombre: "Elevación de Piernas Tumbado", detalle: "Core" },
      { nombre: "Plancha Abdominal (Plank)", detalle: "Core" },
      { nombre: "Plancha Lateral", detalle: "Core" },
      { nombre: "Rueda Abdominal (Ab Wheel)", detalle: "Core" },
      { nombre: "Giro Ruso (Russian Twist)", detalle: "Core" },
      { nombre: "Leñador en Polea (Woodchopper)", detalle: "Core" },
      { nombre: "Dragon Flag", detalle: "Core" },
      { nombre: "Toes to Bar (Pies a la Barra)", detalle: "Core" },
      { nombre: "V-Ups (Abdominales en V)", detalle: "Core" },

      // CARDIO
      { nombre: "Cinta de Correr", detalle: "Cardio" },
      { nombre: "Bicicleta Estática", detalle: "Cardio" },
      { nombre: "Bicicleta Elíptica", detalle: "Cardio" },
      { nombre: "Máquina de Remo (Ergómetro)", detalle: "Cardio" },
      { nombre: "Escaladora (Stairmaster)", detalle: "Cardio" },
      { nombre: "Assault Bike / Air Bike", detalle: "Cardio" },
      { nombre: "SkiErg", detalle: "Cardio" },
      { nombre: "Saltos a la Comba", detalle: "Cardio" },

      // CUERPO COMPLETO
      { nombre: "Burpees", detalle: "Cuerpo completo" },
      { nombre: "Kettlebell Swing", detalle: "Cuerpo completo" },
      { nombre: "Arrancada (Snatch)", detalle: "Cuerpo completo" },
      { nombre: "Dos Tiempos (Clean & Jerk)", detalle: "Cuerpo completo" },
      { nombre: "Cargada de Potencia (Power Clean)", detalle: "Cuerpo completo" },
      { nombre: "Push Press", detalle: "Cuerpo completo" },
      { nombre: "Thruster", detalle: "Cuerpo completo" },
    ];

    const filasEjercicios = await database
      .insert(ejercicios)
      .values(ejerciciosDetalle.map((e) => ({ nombre: e.nombre })))
      .returning({ id: ejercicios.id });

    const enlaces: { ejercicioId: number; categoriaId: number }[] = [];
    for (let i = 0; i < filasEjercicios.length; i++) {
      const nombres = nombresCategoriasParaEjercicio(ejerciciosDetalle[i].detalle);
      for (const nombre of nombres) {
        const cid = mapaCategorias[nombre];
        if (cid != null) {
          enlaces.push({ ejercicioId: filasEjercicios[i].id, categoriaId: cid });
        } else {
          console.warn(`Seed: categoría no encontrada «${nombre}» para «${ejerciciosDetalle[i].nombre}»`);
        }
      }
    }

    if (enlaces.length > 0) {
      await database.insert(ejercicioCategorias).values(enlaces);
    }

    console.log(
      "✅ Datos por defecto insertados (" +
        ejerciciosDetalle.length +
        " ejercicios, " +
        enlaces.length +
        " enlaces categoría)."
    );
  } catch (error) {
    console.error("❌ Error durante el seeding de la base de datos:", error);
  }
};
