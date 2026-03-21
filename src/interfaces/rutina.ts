// src\interfaces\rutina.ts

// Interfaz principal de la Rutina
export interface Rutina {
  id: number;
  nombre: string;
}

// Interfaz para CREAR una rutina
export interface CrearRutinaDTO {
  nombre: string;
}

// Interfaz para EDITAR una rutina
export interface EditarRutinaDTO {
  id: number;
  nombre: string;
}