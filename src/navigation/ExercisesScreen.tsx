import React, { useState, useLayoutEffect, useCallback, useMemo } from "react";
import { View, Text, ActivityIndicator, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCategorias } from "@/hooks/useCategorias";
import { useEjercicios } from "@/hooks/useEjercicios";
import ExerciseList from "@/components/ejercicios/ExerciseList";
import { ExerciseCategoryFilterBar } from "@/components/ejercicios/ExerciseCategoryFilterBar";
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

function tituloFiltro(categorias: { id: number; nombre: string; parentId: number | null }[], categoriaActiva: number | null): string {
  if (categoriaActiva == null) return "Todos los ejercicios";
  const c = categorias.find((x) => x.id === categoriaActiva);
  if (!c) return "Ejercicios";
  if (c.parentId != null) {
    const p = categorias.find((x) => x.id === c.parentId);
    return p ? `${p.nombre} · ${c.nombre}` : c.nombre;
  }
  return c.nombre;
}

export default function ExercisesScreen({ navigation }: Props) {
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<Ejercicio | null>(null);
  const [isOptionsVisible, setOptionsVisible] = useState(false);
  const [isDeleteVisible, setDeleteVisible] = useState(false);
  const [isFormVisible, setFormVisible] = useState(false);

  const { categorias } = useCategorias();
  const { ejercicios, loading, agregar, editar, eliminar } = useEjercicios(categoriaActiva, busqueda);

  const handleCreateNew = useCallback(() => {
    setEjercicioSeleccionado(null);
    setFormVisible(true);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleCreateNew}
          className="mr-1 px-2 py-1 rounded-lg active:bg-slate-800"
          accessibilityLabel="Añadir ejercicio"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={26} color="#34d399" />
        </Pressable>
      ),
    });
  }, [navigation, handleCreateNew]);

  const heading = useMemo(
    () => tituloFiltro(categorias, categoriaActiva),
    [categorias, categoriaActiva]
  );

  const handleOpenOptions = (ejercicio: Ejercicio) => {
    setEjercicioSeleccionado(ejercicio);
    setOptionsVisible(true);
  };

  const handleSaveForm = async (data: { id?: number; nombre: string; categoria_ids: number[] }) => {
    if (ejercicioSeleccionado != null && data.id != null) {
      await editar({ id: data.id, nombre: data.nombre, categoria_ids: data.categoria_ids });
    } else {
      await agregar({ nombre: data.nombre, categoria_ids: data.categoria_ids });
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
      <View className="flex-1 px-4 pt-2 min-h-0">
        <View className="mb-3 shrink-0">
          <Text className="text-white text-xl font-bold">{heading}</Text>
          {!loading ? (
            <Text className="text-slate-500 text-sm mt-0.5">
              {ejercicios.length === 1 ? "1 ejercicio" : `${ejercicios.length} ejercicios`}
            </Text>
          ) : null}
        </View>

        <Text className="text-slate-500 text-xs font-bold uppercase mb-2 shrink-0">Buscar</Text>
        <View className="mb-4 shrink-0">
          <TextInput
            style={buscadorInputStyle}
            placeholder="Nombre del ejercicio…"
            placeholderTextColor="#94a3b8"
            value={busqueda}
            onChangeText={setBusqueda}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            underlineColorAndroid="transparent"
          />
        </View>

        <View className="mb-4 shrink-0">
          <ExerciseCategoryFilterBar
            categorias={categorias}
            categoriaActiva={categoriaActiva}
            onChange={setCategoriaActiva}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
        ) : (
          <View className="flex-1 min-h-0">
            <ExerciseList
              ejercicios={ejercicios}
              onExercisePress={(ej) => navigation.navigate("ExerciseDetail", { ejercicioId: ej.id })}
              onOptionsPress={handleOpenOptions}
            />
          </View>
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
