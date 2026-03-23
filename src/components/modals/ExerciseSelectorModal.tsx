import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useCategorias } from '@/hooks/useCategorias';
import { useEjercicios } from '@/hooks/useEjercicios';
import ExerciseList from '@/components/ejercicios/ExerciseList';
import { Ejercicio } from '@/interfaces/ejercicio';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (ejercicio: Ejercicio) => void;
}

export default function ExerciseSelectorModal({ visible, onClose, onSelect }: Props) {
  const[busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);

  const { categorias } = useCategorias();
  const { ejercicios, loading } = useEjercicios(categoriaActiva, busqueda);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-slate-900 mt-10 rounded-t-3xl border-t border-slate-700 p-4">
        
        {/* CABECERA */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-xl font-bold">Seleccionar Ejercicio</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-red-400 font-bold">Cerrar</Text>
          </TouchableOpacity>
        </View>

        {/* BUSCADOR */}
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 mb-4"
          placeholder="Buscar ejercicio..."
          placeholderTextColor="#64748b"
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {/* CATEGORÍAS */}
        <View className="h-12 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              className={`px-4 py-2 rounded-full mr-2 justify-center ${categoriaActiva === null ? 'bg-blue-600' : 'bg-slate-800'}`}
              onPress={() => setCategoriaActiva(null)}
            >
              <Text className="text-white font-bold">Todas</Text>
            </TouchableOpacity>
            {categorias.map(cat => (
              <TouchableOpacity 
                key={cat.id}
                className={`px-4 py-2 rounded-full mr-2 justify-center ${categoriaActiva === cat.id ? 'bg-blue-600' : 'bg-slate-800'}`}
                onPress={() => setCategoriaActiva(cat.id)}
              >
                <Text className="text-white font-bold">{cat.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* LISTA DE RESULTADOS (Reutilizada de tu código anterior) */}
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
        ) : (
          <ExerciseList 
            ejercicios={ejercicios} 
            onExercisePress={(ej) => {
              onSelect(ej);
              onClose(); // Cerramos al seleccionar
            }} 
          />
        )}
      </View>
    </Modal>
  );
}