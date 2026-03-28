import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
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

type BloqueEntreno = {
  entrenamientoId: number;
  fecha: string;
  rutinaNombre: string;
  diaNombre: string | null;
  series: HistorialEjercicioFila[];
};

function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function agruparPorEntreno(rows: HistorialEjercicioFila[]): BloqueEntreno[] {
  const orden: number[] = [];
  const map = new Map<number, HistorialEjercicioFila[]>();

  for (const r of rows) {
    if (!map.has(r.entrenamientoId)) {
      map.set(r.entrenamientoId, []);
      orden.push(r.entrenamientoId);
    }
    map.get(r.entrenamientoId)!.push(r);
  }

  return orden.map((entrenamientoId) => {
    const series = map.get(entrenamientoId)!;
    const head = series[0];
    return {
      entrenamientoId,
      fecha: head.fecha,
      rutinaNombre: head.rutinaNombre,
      diaNombre: head.diaNombre,
      series,
    };
  });
}

export default function ExerciseDetailScreen({ route }: Props) {
  const { ejercicioId } = route.params;
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialEjercicioFila[]>([]);

  const bloques = useMemo(() => agruparPorEntreno(historial), [historial]);

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
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          data={bloques}
          keyExtractor={(item) => item.entrenamientoId.toString()}
          ListHeaderComponent={
            <View className="mb-5">
              <Text className="text-white text-2xl font-bold">{nombre || "Ejercicio"}</Text>
              <Text className="text-slate-400 mt-1 mb-4">{categoria ?? "Sin categoría"}</Text>
              <Text className="text-slate-500 text-xs font-bold uppercase">Historial por entreno</Text>
              <Text className="text-slate-600 text-xs mt-1 leading-4">
                Cada bloque es un día que finalizaste; dentro verás todas las series de este ejercicio en esa sesión.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="text-slate-500 text-center mt-6">
              Aún no has registrado series para este ejercicio.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="bg-slate-800/95 rounded-2xl mb-4 border border-slate-700 overflow-hidden">
              <View className="px-4 py-3 border-b border-slate-700 bg-slate-800">
                <Text className="text-slate-500 text-xs">{item.fecha}</Text>
                <Text className="text-white text-base font-bold capitalize mt-0.5">{fechaLegible(item.fecha)}</Text>
                <Text className="text-emerald-400 font-semibold text-sm mt-2">{item.rutinaNombre}</Text>
                <Text className="text-slate-400 text-sm">{item.diaNombre ?? ""}</Text>
              </View>
              <View className="p-3 gap-2">
                {item.series.map((s) => (
                  <View
                    key={s.id}
                    className="bg-slate-900/70 px-3 py-2.5 rounded-xl border border-slate-700/80 flex-row justify-between items-center"
                  >
                    <Text className="text-slate-400 text-sm">Serie {s.serieOrden}</Text>
                    <Text className="text-slate-100 font-mono text-sm">
                      {s.reps} reps @ {s.peso} kg
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
