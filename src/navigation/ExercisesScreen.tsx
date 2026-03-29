import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { useCategorias } from '@/hooks/useCategorias';
import { useEjercicios } from '@/hooks/useEjercicios';
import ExerciseList from '@/components/ejercicios/ExerciseList';
import { Ejercicio } from '@/interfaces/ejercicio';

// Importamos los modales
import { OptionsModal, DeleteModal, FormModal } from "@/components/modals/ExerciseModals";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";

const buscadorInputStyle = {
  backgroundColor: "#1e293b",
  color: "#f8fafc",
  borderWidth: 1,
  borderColor: "#64748b",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
} as const;

type Props = NativeStackScreenProps<RootStackParamList, "Exercises">;

export default function ExercisesScreen({ navigation }: Props) {
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<Ejercicio | null>(null);
  const [isOptionsVisible, setOptionsVisible] = useState(false);
  const [isDeleteVisible, setDeleteVisible] = useState(false);
  const [isFormVisible, setFormVisible] = useState(false);

  const { categorias } = useCategorias();
  const { ejercicios, loading, agregar, editar, eliminar } = useEjercicios(categoriaActiva, busqueda);

  // --- LÓGICA DE MANEJO DE EVENTOS ---
  const handleOpenOptions = (ejercicio: Ejercicio) => {
    setEjercicioSeleccionado(ejercicio);
    setOptionsVisible(true);
  };

  const handleCreateNew = () => {
    setEjercicioSeleccionado(null); // Null significa modo "Crear"
    setFormVisible(true);
  };

  const handleSaveForm = async (data: { id?: number; nombre: string; categoria_id: number | null }) => {
    if (ejercicioSeleccionado != null && data.id != null) {
      await editar({ id: data.id, nombre: data.nombre, categoria_id: data.categoria_id });
    } else {
      await agregar({ nombre: data.nombre, categoria_id: data.categoria_id });
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

      <Text className="text-white text-2xl font-bold mb-3">
        {categoriaActiva === null ? "Todos los ejercicios" : `Ejercicios de ${categorias.find((c) => c.id === categoriaActiva)?.nombre}`}
      </Text>

      <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Buscar</Text>
      <View className="mb-4">
        <TextInput
          style={buscadorInputStyle}
          placeholder="Buscar por nombre…"
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          underlineColorAndroid="transparent"
        />
      </View>

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
        nombreEjercicio={ejercicioSeleccionado?.nombre}
        onEdit={() => {
          setOptionsVisible(false);
          setFormVisible(true);
        }}
        onDelete={() => {
          setOptionsVisible(false);
          setDeleteVisible(true);
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