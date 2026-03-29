import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useCategorias } from "@/hooks/useCategorias";
import { useEjercicios } from "@/hooks/useEjercicios";
import ExerciseList from "@/components/ejercicios/ExerciseList";
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

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (ejercicio: Ejercicio) => void;
}

export default function ExerciseSelectorModal({
  visible,
  onClose,
  onSelect,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);

  const { categorias } = useCategorias();
  const { ejercicios, loading } = useEjercicios(categoriaActiva, busqueda);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-900  border-slate-700 p-4">
        {/* CABECERA */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-xl font-bold">
            Seleccionar Ejercicio
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-red-400 font-bold">Cerrar</Text>
          </TouchableOpacity>
        </View>

        {/* BUSCADOR */}
        <View className="mb-4">
        <TextInput
          style={buscadorInputStyle}
          placeholder="Buscar ejercicio…"
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false}
          autoCapitalize="none"
          underlineColorAndroid="transparent"
        />
        </View>

        {/* CATEGORÍAS */}
        <View className="h-12 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 justify-center ${categoriaActiva === null ? "bg-blue-600" : "bg-slate-800"}`}
              onPress={() => setCategoriaActiva(null)}
            >
              <Text className="text-white font-bold">Todas</Text>
            </TouchableOpacity>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                className={`px-4 py-2 rounded-full mr-2 justify-center ${categoriaActiva === cat.id ? "bg-blue-600" : "bg-slate-800"}`}
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
            disableNavigation // Deshabilitamos la navegación dentro del modal
          />
        )}
      </View>
    </Modal>
  );
}
