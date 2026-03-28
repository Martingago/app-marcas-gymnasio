import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import { getDetalleSesion } from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "SessionDetail">;

export default function SessionDetailScreen({ route }: Props) {
  const { entrenamientoId } = route.params;
  const [loading, setLoading] = useState(true);
  const [cabecera, setCabecera] = useState<{
    fecha: string;
    diaNombre: string | null;
    rutinaNombre: string | null;
  } | null>(null);
  const [series, setSeries] = useState<
    { ejercicioNombre: string; reps: number; peso: number; serieOrden: number }[]
  >([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getDetalleSesion(entrenamientoId);
      setCabecera(
        d.cabecera
          ? {
              fecha: d.cabecera.fecha,
              diaNombre: d.cabecera.diaNombre,
              rutinaNombre: d.cabecera.rutinaNombre,
            }
          : null
      );
      setSeries(d.series);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [entrenamientoId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 p-4">
        {cabecera ? (
          <>
            <Text className="text-slate-400 text-xs font-bold uppercase">Entreno</Text>
            <Text className="text-white text-2xl font-bold mb-1">{cabecera.fecha}</Text>
            <Text className="text-emerald-400 font-semibold">{cabecera.rutinaNombre ?? "—"}</Text>
            <Text className="text-slate-400 mb-6">{cabecera.diaNombre ?? ""}</Text>
          </>
        ) : null}

        {series.map((s, i) => (
          <View
            key={`${s.ejercicioNombre}-${i}`}
            className="bg-slate-800 p-3 rounded-xl mb-2 border border-slate-700 flex-row justify-between"
          >
            <View className="flex-1">
              <Text className="text-white font-bold">{s.ejercicioNombre}</Text>
              <Text className="text-slate-500 text-xs mt-1">Serie {s.serieOrden}</Text>
            </View>
            <Text className="text-slate-200 font-mono">
              {s.reps} reps @ {s.peso} kg
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
