import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ejercicio } from '@/interfaces/ejercicio';

interface Props {
  ejercicio: Ejercicio;
  onPress?: (ejercicio: Ejercicio) => void;
}

export default function ExerciseItem({ ejercicio, onPress }: Props) {
  return (
    <TouchableOpacity 
      className="bg-slate-800 p-4 rounded-xl mb-3 flex-row justify-between items-center border border-slate-700"
      onPress={() => onPress && onPress(ejercicio)}
      activeOpacity={0.7}
    >
      <View className="flex-1">
        <Text className="text-white text-lg font-semibold">{ejercicio.nombre}</Text>
        {/* Mostramos la categoría si la tiene, si no, un texto por defecto */}
        <Text className="text-slate-400 text-sm mt-1">
          {ejercicio.categoria_nombre || 'Sin categoría'}
        </Text>
      </View>
      
      {/* Aquí podríamos poner un icono de "flechita" o "editar" en el futuro */}
      <View className="bg-slate-700 px-3 py-1 rounded-full">
        <Text className="text-slate-300 text-xs">ID: {ejercicio.id}</Text>
      </View>
    </TouchableOpacity>
  );
}