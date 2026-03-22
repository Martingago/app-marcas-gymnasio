import { useState, useEffect } from 'react';
import { Ejercicio } from '@/interfaces/ejercicio';
import { getEjercicios } from '@/services/ejercicios/ejerciciosService';

export const useEjercicios = (categoriaIdFiltro: number | null) => {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const cargarEjercicios = async () => {
    setLoading(true);
    try {
      const data = await getEjercicios(categoriaIdFiltro);
      setEjercicios(data);
    } catch (error) {
      console.error("Error cargando ejercicios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cada vez que cambie el filtro de categoría, se vuelve a ejecutar la consulta
  useEffect(() => {
    cargarEjercicios();
  }, [categoriaIdFiltro]);

  return { ejercicios, loading, recargarEjercicios: cargarEjercicios };
};