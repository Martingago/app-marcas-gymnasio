import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCategorias } from "@/hooks/useCategorias";
import { useEjercicios } from "@/hooks/useEjercicios";
import ExerciseList from "@/components/ejercicios/ExerciseList";
import { Ejercicio } from "@/interfaces/ejercicio";

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

  const handleOpenOptions = (ejercicio: Ejercicio) => {
    setEjercicioSeleccionado(ejercicio);
    setOptionsVisible(true);
  };

  const handleCreateNew = () => {
    setEjercicioSeleccionado(null);
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
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <View className="flex-1 px-4 pt-2">
        <Text className="text-slate-600 text-[10px] font-bold uppercase mb-2">Filtrar por categoría</Text>
        <View className="flex-row items-stretch gap-2 mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ gap: 8, alignItems: "center", paddingVertical: 2, paddingRight: 4 }}
          >
            <Pressable
              onPress={() => setCategoriaActiva(null)}
              className={`px-4 py-2.5 rounded-xl border ${
                categoriaActiva === null
                  ? "bg-blue-600 border-blue-500"
                  : "bg-slate-800 border-slate-700 active:opacity-90"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${categoriaActiva === null ? "text-white" : "text-slate-300"}`}
                numberOfLines={1}
              >
                Todas
              </Text>
            </Pressable>

            {categorias.map((cat) => {
              const active = categoriaActiva === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoriaActiva(cat.id)}
                  className={`px-4 py-2.5 rounded-xl border max-w-[148px] ${
                    active ? "bg-blue-600 border-blue-500" : "bg-slate-800 border-slate-700 active:opacity-90"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}
                    numberOfLines={1}
                  >
                    {cat.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            className="bg-emerald-600 px-3.5 py-2.5 rounded-xl border border-emerald-500 flex-row items-center justify-center gap-1.5 shrink-0"
            onPress={handleCreateNew}
            activeOpacity={0.85}
            accessibilityLabel="Añadir nuevo ejercicio"
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text className="text-white text-sm font-bold">Nuevo</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-white text-2xl font-bold mb-3">
          {categoriaActiva === null
            ? "Todos los ejercicios"
            : `Ejercicios de ${categorias.find((c) => c.id === categoriaActiva)?.nombre ?? "…"}`}
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

        <DeleteModal
          visible={isDeleteVisible}
          ejercicio={ejercicioSeleccionado}
          onClose={() => setDeleteVisible(false)}
          onConfirm={handleConfirmDelete}
        />

        <FormModal
          visible={isFormVisible}
          categorias={categorias}
          ejercicioAEditar={ejercicioSeleccionado}
          onClose={() => setFormVisible(false)}
          onSave={handleSaveForm}
        />
      </View>
    </SafeAreaView>
  );
}
