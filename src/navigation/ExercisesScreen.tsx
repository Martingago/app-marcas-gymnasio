import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useCategorias } from '@/hooks/useCategorias';
import { useEjercicios } from '@/hooks/useEjercicios';
import ExerciseList from '@/components/ejercicios/ExerciseList';

export default function ExercisesScreen() {
  // Estado local para saber qué categoría está seleccionada (null = Todas)
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);

  // Custom Hooks
  const { categorias } = useCategorias();
  const { ejercicios, loading } = useEjercicios(categoriaActiva);

  return (
    <View className="flex-1 bg-slate-900 p-4">
      
      {/* HEADER: Filtros y Botón Añadir */}
      <View className="flex-row items-center mb-6">
        
        {/* Scroll Horizontal de Categorías (El "Select" de móvil) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-1 mr-4"
        >
          {/* Opción "Todas" */}
          <TouchableOpacity 
            className={`px-4 py-2 rounded-full mr-2 ${categoriaActiva === null ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}
            onPress={() => setCategoriaActiva(null)}
          >
            <Text className={categoriaActiva === null ? 'text-white font-bold' : 'text-slate-300'}>
              Todas
            </Text>
          </TouchableOpacity>

          {/* Opciones dinámicas de la base de datos */}
          {categorias.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              className={`px-4 py-2 rounded-full mr-2 ${categoriaActiva === cat.id ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}
              onPress={() => setCategoriaActiva(cat.id)}
            >
              <Text className={categoriaActiva === cat.id ? 'text-white font-bold' : 'text-slate-300'}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BOTÓN AÑADIR */}
        <TouchableOpacity 
          className="bg-emerald-600 w-10 h-10 rounded-full justify-center items-center shadow-lg"
          onPress={() => console.log("Abrir modal para crear ejercicio")}
        >
          <Text className="text-white text-2xl font-bold leading-none mt-[-2px]">+</Text>
        </TouchableOpacity>
      </View>

      {/* TÍTULO DE SECCIÓN */}
      <Text className="text-white text-2xl font-bold mb-4">
        {categoriaActiva === null 
          ? 'Todos los ejercicios' 
          : `Ejercicios de ${categorias.find(c => c.id === categoriaActiva)?.nombre}`}
      </Text>

      {/* LISTA (NUESTRO COMPONENTE REUTILIZABLE) */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ExerciseList 
          ejercicios={ejercicios} 
          onExercisePress={(ej) => console.log("Clic en ejercicio:", ej.nombre)}
        />
      )}

    </View>
  );
}