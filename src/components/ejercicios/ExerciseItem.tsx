import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ejercicio } from '@/interfaces/ejercicio';
import { Ionicons } from '@expo/vector-icons'; // Iconos nativos de Expo

interface Props {
  ejercicio: Ejercicio;
  onPress?: (ejercicio: Ejercicio) => void;
  onOptionsPress?: (ejercicio: Ejercicio) => void; // Evento nuevo para los 3 puntitos
}

export default function ExerciseItem({ ejercicio, onPress, onOptionsPress }: Props) {
  return (
    <TouchableOpacity 
      className="bg-slate-800 p-4 rounded-xl mb-3 flex-row items-center border border-slate-700"
      onPress={() => onPress && onPress(ejercicio)}
      activeOpacity={0.7}
    >
      <View className="flex-1">
        <Text className="text-white text-lg font-semibold">{ejercicio.nombre}</Text>
        <Text className="text-slate-400 text-sm mt-1">
          {ejercicio.categoria_nombre || 'Sin categoría'}
        </Text>
      </View>
      
            {/* Icono de navegación indicativa */}
      <Ionicons name="chevron-forward" size={20} color="#64748b" />

      {/* Botón de 3 puntitos (Ajustes) */}
      <TouchableOpacity 
        className="p-2"
        onPress={() => onOptionsPress && onOptionsPress(ejercicio)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
      </TouchableOpacity>


    </TouchableOpacity>
  );
}