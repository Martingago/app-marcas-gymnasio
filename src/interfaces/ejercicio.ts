export interface Ejercicio {
  id: number;
  nombre: string;
  /** Todas las categorías asignadas (global + detalle) */
  categoria_ids: number[];
  /** Texto para listas: "Brazo · Tríceps" */
  categoria_nombre?: string | null;
}

export interface CrearEjercicioDTO {
  nombre: string;
  categoria_ids: number[];
}

export interface EditarEjercicioDTO {
  id: number;
  nombre: string;
  categoria_ids: number[];
}
