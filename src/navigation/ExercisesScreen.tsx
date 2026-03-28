import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useCategorias } from '@/hooks/useCategorias';
import { useEjercicios } from '@/hooks/useEjercicios';
import ExerciseList from '@/components/ejercicios/ExerciseList';
import { Ejercicio } from '@/interfaces/ejercicio';

// Importamos los modales
import { OptionsModal, DeleteModal, FormModal } from '@/components/modals/ExerciseModals';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Exercises'>;

export default function ExercisesScreen({ navigation }: Props) {
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  
  // Estados para controlar Modales
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<Ejercicio | null>(null);
  const [isOptionsVisible, setOptionsVisible] = useState(false);
  const[isDeleteVisible, setDeleteVisible] = useState(false);
  const[isFormVisible, setFormVisible] = useState(false);

  const { categorias } = useCategorias();
  const { ejercicios, loading, agregar, editar, eliminar } = useEjercicios(categoriaActiva);

  // --- LÓGICA DE MANEJO DE EVENTOS ---
  const handleOpenOptions = (ejercicio: Ejercicio) => {
    setEjercicioSeleccionado(ejercicio);
    setOptionsVisible(true);
  };

  const handleCreateNew = () => {
    setEjercicioSeleccionado(null); // Null significa modo "Crear"
    setFormVisible(true);
  };

  const handleSaveForm = async (data: any) => {
    if (ejercicioSeleccionado) {
      await editar(data); // Modo Editar
    } else {
      await agregar(data); // Modo Añadir
    }
  };

  const handleConfirmDelete = async () => {
    if (ejercicioSeleccionado) {
      await eliminar(ejercicioSeleccionado.id);
      setDeleteVisible(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 p-4">
      <View className="flex-row items-center mb-6 mt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 mr-4">
          <TouchableOpacity 
            className={`px-4 py-2 rounded-full mr-2 ${categoriaActiva === null ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}
            onPress={() => setCategoriaActiva(null)}
          >
            <Text className={categoriaActiva === null ? 'text-white font-bold' : 'text-slate-300'}>Todas</Text>
          </TouchableOpacity>

          {categorias.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              className={`px-4 py-2 rounded-full mr-2 ${categoriaActiva === cat.id ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}
              onPress={() => setCategoriaActiva(cat.id)}
            >
              <Text className={categoriaActiva === cat.id ? 'text-white font-bold' : 'text-slate-300'}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity 
          className="bg-emerald-600 w-12 h-12 rounded-full justify-center items-center shadow-lg"
          onPress={handleCreateNew}
        >
          <Text className="text-white text-3xl font-bold leading-none mt-[-4px]">+</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-white text-2xl font-bold mb-4">
        {categoriaActiva === null ? 'Todos los ejercicios' : `Ejercicios de ${categorias.find(c => c.id === categoriaActiva)?.nombre}`}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
      ) : (
        <ExerciseList
          ejercicios={ejercicios}
          onExercisePress={(ej) => navigation.navigate("ExerciseDetail", { ejercicioId: ej.id })}
          onOptionsPress={handleOpenOptions}
        />
      )}

      {/* --- RENDERIZADO DE MODALES --- */}
      
      {/* Modal de Toast de Opciones */}
      <OptionsModal 
        visible={isOptionsVisible} 
        onClose={() => setOptionsVisible(false)}
        onEdit={() => {
          setOptionsVisible(false);
          setFormVisible(true); // Abre el formulario con el ejercicioSeleccionado
        }}
        onDelete={() => {
          setOptionsVisible(false);
          setDeleteVisible(true); // Abre confirmación de borrado
        }}
      />

      {/* Modal Confirmar Borrar */}
      <DeleteModal 
        visible={isDeleteVisible}
        ejercicio={ejercicioSeleccionado}
        onClose={() => setDeleteVisible(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal Formulario Añadir/Editar */}
      <FormModal 
        visible={isFormVisible}
        categorias={categorias}
        ejercicioAEditar={ejercicioSeleccionado}
        onClose={() => setFormVisible(false)}
        onSave={handleSaveForm}
      />

    </SafeAreaView>
  );
}