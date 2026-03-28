import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import { getEjercicioById } from "@/services/ejercicios/ejerciciosService";
import {
  getHistorialPorEjercicio,
  HistorialEjercicioFila,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "ExerciseDetail">;

export default function ExerciseDetailScreen({ route }: Props) {
  const { ejercicioId } = route.params;
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialEjercicioFila[]>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [ej, hist] = await Promise.all([
        getEjercicioById(ejercicioId),
        getHistorialPorEjercicio(ejercicioId),
      ]);
      if (ej) {
        setNombre(ej.nombre);
        setCategoria(ej.categoria_nombre ?? null);
      }
      setHistorial(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ejercicioId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900 p-4">
      <Text className="text-white text-2xl font-bold">{nombre || "Ejercicio"}</Text>
      <Text className="text-slate-400 mb-6">{categoria ?? "Sin categoría"}</Text>
      <Text className="text-slate-500 text-xs font-bold uppercase mb-3">Historial de series</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
      ) : historial.length === 0 ? (
        <Text className="text-slate-500 text-center mt-6">
          Aún no has registrado series para este ejercicio.
        </Text>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="bg-slate-800 p-4 rounded-xl mb-3 border border-slate-700">
              <Text className="text-slate-500 text-xs">{item.fecha}</Text>
              <Text className="text-emerald-400 font-bold mt-1">{item.rutinaNombre}</Text>
              <Text className="text-slate-400 text-sm">{item.diaNombre ?? ""}</Text>
              <Text className="text-white mt-2">
                Serie {item.serieOrden}: {item.reps} reps @ {item.peso} kg
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
