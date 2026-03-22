// src\interfaces\ejercicio.ts

// Interfaz principal del Ejercicio (Lo que devuelve la BD al listar)
export interface Ejercicio {
  id: number;
  nombre: string;
  categoria_id: number | null;
  categoria_nombre?: string | null; // Opcional, lo uniremos con un JOIN en SQL para mostrarlo en la UI
}

// Interfaz para el Formulario de CREAR un ejercicio
export interface CrearEjercicioDTO {
  nombre: string;
  categoria_id: number | null;
}

// Interfaz para el Formulario de EDITAR un ejercicio
export interface EditarEjercicioDTO {
  id: number;
  nombre: string;
  categoria_id: number | null;
}