import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import { formatoFechaDMY, formatoFechaTituloExtendido } from "@/lib/fechaFormato";
import {
  getDetalleSesion,
  type DetalleSesionSerie,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "SessionDetail">;

function agruparSeriesPorEjercicio(items: DetalleSesionSerie[]) {
  const ordenIds: number[] = [];
  const porId = new Map<number, DetalleSesionSerie[]>();
  const nombres = new Map<number, string>();

  for (const s of items) {
    const id = s.ejercicioId;
    if (!porId.has(id)) {
      porId.set(id, []);
      ordenIds.push(id);
    }
    nombres.set(id, s.ejercicioNombre);
    porId.get(id)!.push(s);
  }

  return ordenIds.map((ejercicioId) => ({
    ejercicioId,
    nombre: nombres.get(ejercicioId) ?? "—",
    series: porId.get(ejercicioId)!,
  }));
}

export default function SessionDetailScreen({ route, navigation }: Props) {
  const { entrenamientoId } = route.params;
  const [loading, setLoading] = useState(true);
  const [cabecera, setCabecera] = useState<{
    fecha: string;
    diaNombre: string | null;
    rutinaNombre: string | null;
  } | null>(null);
  const [series, setSeries] = useState<DetalleSesionSerie[]>([]);

  const bloquesEjercicio = useMemo(() => agruparSeriesPorEjercicio(series), [series]);

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
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {cabecera ? (
          <>
            <Text className="text-slate-400 text-xs font-bold uppercase">Entreno</Text>
            <Text className="text-white text-2xl font-bold mb-1">{formatoFechaTituloExtendido(cabecera.fecha)}</Text>
            <Text className="text-slate-500 text-sm mb-1">{formatoFechaDMY(cabecera.fecha)}</Text>
            <Text className="text-emerald-400 font-semibold">{cabecera.rutinaNombre ?? "—"}</Text>
            <Text className="text-slate-400 mb-6">{cabecera.diaNombre ?? ""}</Text>
          </>
        ) : null}

        <Text className="text-slate-500 text-xs font-bold uppercase mb-3">Por ejercicio</Text>

        {bloquesEjercicio.length === 0 ? (
          <Text className="text-slate-500">No hay series registradas en este entreno.</Text>
        ) : (
          bloquesEjercicio.map((bloque) => (
            <TouchableOpacity
              key={bloque.ejercicioId}
              activeOpacity={0.88}
              onPress={() => navigation.navigate("ExerciseDetail", { ejercicioId: bloque.ejercicioId })}
              className="bg-slate-800/95 rounded-2xl mb-4 border border-slate-700 overflow-hidden"
            >
              <View className="px-4 py-3 border-b border-slate-700 bg-slate-800 flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-white text-lg font-bold">{bloque.nombre}</Text>
                  <Text className="text-slate-500 text-xs mt-1">
                    {bloque.series.length} serie{bloque.series.length === 1 ? "" : "s"} · Pulsa para ver historial
                  </Text>
                </View>
                <Text className="text-blue-400 text-xl">›</Text>
              </View>
              <View className="p-3 gap-2">
                {bloque.series.map((s) => (
                  <View
                    key={s.id}
                    className={`bg-slate-900/70 px-3 py-2.5 rounded-xl border flex-row justify-between items-center ${
                      s.esDropset ? "border-violet-600/50 ml-3" : "border-slate-700/80"
                    }`}
                  >
                    <Text className="text-slate-400 text-sm">
                      {s.esDropset ? `Serie ${s.serieOrden} · dropset` : `Serie ${s.serieOrden}`}
                    </Text>
                    <Text className="text-slate-100 font-mono text-sm">
                      {s.reps} reps @ {s.peso} kg
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
