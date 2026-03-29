import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCategorias } from "@/hooks/useCategorias";
import { useEjercicios } from "@/hooks/useEjercicios";
import ExerciseList from "@/components/ejercicios/ExerciseList";
import { ExerciseCategoryFilterBar } from "@/components/ejercicios/ExerciseCategoryFilterBar";
import { Ejercicio } from "@/interfaces/ejercicio";

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

function tituloFiltro(
  categorias: { id: number; nombre: string; parentId: number | null }[],
  categoriaActiva: number | null
): string {
  if (categoriaActiva == null) return "Todos";
  const c = categorias.find((x) => x.id === categoriaActiva);
  if (!c) return "Filtrado";
  if (c.parentId != null) {
    const p = categorias.find((x) => x.id === c.parentId);
    return p ? `${p.nombre} · ${c.nombre}` : c.nombre;
  }
  return c.nombre;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (ejercicio: Ejercicio) => void;
}

export default function ExerciseSelectorModal({ visible, onClose, onSelect }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);

  const { categorias } = useCategorias();
  const { ejercicios, loading } = useEjercicios(categoriaActiva, busqueda);

  const subheading = useMemo(
    () => tituloFiltro(categorias, categoriaActiva),
    [categorias, categoriaActiva]
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-900">
        <View className="flex-1 px-4 pt-2 min-h-0">
          <View className="flex-row justify-between items-start mb-3 shrink-0">
            <View className="flex-1 pr-3">
              <Text className="text-white text-xl font-bold">Elegir ejercicio</Text>
              <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>
                {loading ? "Cargando…" : `${ejercicios.length} resultado${ejercicios.length === 1 ? "" : "s"} · ${subheading}`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="py-2 px-1" accessibilityRole="button" accessibilityLabel="Cerrar">
              <Text className="text-slate-400 font-semibold">Cerrar</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-slate-500 text-xs font-bold uppercase mb-2 shrink-0">Buscar</Text>
          <View className="mb-3 shrink-0">
            <TextInput
              style={buscadorInputStyle}
              placeholder="Nombre del ejercicio…"
              placeholderTextColor="#94a3b8"
              value={busqueda}
              onChangeText={setBusqueda}
              autoCorrect={false}
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
          </View>

          <View className="mb-3 shrink-0">
            <ExerciseCategoryFilterBar
              categorias={categorias}
              categoriaActiva={categoriaActiva}
              onChange={setCategoriaActiva}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" className="mt-8" />
          ) : (
            <View className="flex-1 min-h-0">
              <ExerciseList
                ejercicios={ejercicios}
                onExercisePress={(ej) => {
                  onSelect(ej);
                  onClose();
                }}
                disableNavigation
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
