export interface Categoria {
  id: number;
  nombre: string;
  parentId: number | null;
}

export interface CrearCategoriaDTO {
  nombre: string;
  parentId?: number | null;
}

export interface EditarCategoriaDTO {
  id: number;
  nombre: string;
  parentId?: number | null;
}
