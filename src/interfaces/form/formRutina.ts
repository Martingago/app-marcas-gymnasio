// src/interfaces/rutina.ts
export interface FormRutinaDiaEjercicioSerie {
  id_temp: string;
  reps_objetivo: string;
  peso_objetivo: string;
}

export interface FormRutinaDiaEjercicio {
  id_temp: string;
  ejercicio_id: number | null;
  ejercicio_nombre?: string;
  series: FormRutinaDiaEjercicioSerie[]; // <-- Cambiado
}

export interface FormRutinaDia {
  id_temp: string;
  nombre: string;
  ejercicios: FormRutinaDiaEjercicio[];
}

export interface FormRutina {
  nombre: string;
  dias: FormRutinaDia[];
}