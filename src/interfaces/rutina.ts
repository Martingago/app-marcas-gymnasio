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
