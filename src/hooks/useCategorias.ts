import { useState, useEffect } from 'react';
import { Categoria } from '@/interfaces/categoria';
import { getCategorias } from '@/services/categoria/categoriasService';


export const useCategorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const cargarCategorias = async () => {
    const data = await getCategorias();
    setCategorias(data);
  };

  useEffect(() => {
    cargarCategorias();
  },[]);

  return { categorias, recargarCategorias: cargarCategorias };
};