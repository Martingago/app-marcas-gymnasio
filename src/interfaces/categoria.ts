// src\interfaces\categoria.ts

// Interfaz para las categorías (Espalda, Pecho, etc.)
export interface Categoria {
  id: number;
  nombre: string;
}

// Interfaz para el Formulario de CREAR una categoría
export interface CrearCategoriaDTO {
  nombre: string;
}

// Interfaz para el Formulario de EDITAR una categoría
export interface EditarCategoriaDTO {
  id: number;
  nombre: string;
}