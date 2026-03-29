import { useState, useEffect } from 'react';
import { Ejercicio, CrearEjercicioDTO, EditarEjercicioDTO } from '@/interfaces/ejercicio';
import { getEjercicios, addEjercicio, updateEjercicio, deleteEjercicio } from '@/services/ejercicios/ejerciciosService';

export const useEjercicios = (categoriaIdFiltro: number | null, searchQuery: string ="") => {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const[loading, setLoading] = useState<boolean>(true);

  const cargarEjercicios = async () => {
    setLoading(true);
    try {
      const data = await getEjercicios(categoriaIdFiltro, searchQuery);
      setEjercicios(data);
    } catch (e) {
      console.error("useEjercicios: fallo al cargar", e);
      setEjercicios([]);
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
    cargarEjercicios();
  }, [categoriaIdFiltro, searchQuery]);

  // NUEVAS FUNCIONES PARA EL CRUD
  const agregar = async (data: CrearEjercicioDTO) => {
    const nuevo = await addEjercicio(data);
    setEjercicios(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const editar = async (data: EditarEjercicioDTO) => {
    const editado = await updateEjercicio(data);
    setEjercicios(prev => prev.map(e => e.id === editado.id ? editado : e).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const eliminar = async (id: number) => {
    await deleteEjercicio(id);
    setEjercicios(prev => prev.filter(e => e.id !== id));
  };

  return { ejercicios, loading, agregar, editar, eliminar };
};