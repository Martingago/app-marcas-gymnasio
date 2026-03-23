// src\interfaces\rutina.ts

// Interfaz principal de la Rutina
export interface Rutina {
  id: number;
  nombre: string;
}

export interface RutinaDia {
  id: number;
  rutina_id: number;
  nombre: string;
  orden: number;
}

export interface RutinaDiaEjercicio {
  id: number;
  rutina_dia_id: number;
  ejercicio_id: number;
  series_objetivo: number;
  reps_objetivo: string;
  orden: number;
  // Join fields
  ejercicio_nombre?: string;
}

export interface FormRutinaDiaEjercicio {
  id_temp: string;
  ejercicio_id: number | null;
  ejercicio_nombre?: string;
  series_objetivo: string; // Lo usamos como string para el TextInput
  reps_objetivo: string;
}

export interface FormRutinaDia {
  id_temp: string;
  nombre: string; // Ej: "Día 1: Pecho"
  ejercicios: FormRutinaDiaEjercicio[];
}

export interface FormRutina {
  nombre: string;
  dias: FormRutinaDia[];
}