import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

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

function construirTextoCompartir(
  cabecera: { fecha: string; diaNombre: string | null; rutinaNombre: string | null },
  bloques: { nombre: string; series: DetalleSesionSerie[] }[]
): string {
  const fechaStr = formatoFechaDMY(cabecera.fecha);
  const rutina = cabecera.rutinaNombre ?? "—";
  const dia = cabecera.diaNombre ?? "—";
  const header = `Detalles de entreno - ${fechaStr}. ${rutina}, ${dia}.`;
  if (bloques.length === 0) return header;
  const bloquesTxt = bloques.map((b) => {
    const lineasSeries = b.series.map((s) => {
      const serieEtiqueta = s.esDropset
        ? `Serie ${s.serieOrden} · dropset`
        : `Serie ${s.serieOrden}`;
      return `${serieEtiqueta}, ${s.peso} kg, ${s.reps} reps`;
    });
    return `${b.nombre}\n${lineasSeries.join("\n")}`;
  });
  return `${header}\n\n${bloquesTxt.join("\n\n")}`;
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

  const copiarDetalleEntreno = useCallback(async () => {
    if (!cabecera) return;
    const texto = construirTextoCompartir(cabecera, bloquesEjercicio);
    try {
      await Clipboard.setStringAsync(texto);
      Alert.alert("Copiado", "El detalle del entreno está en el portapapeles.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo copiar al portapapeles.");
    }
  }, [cabecera, bloquesEjercicio]);

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
            <Text className="text-slate-400 mb-4">{cabecera.diaNombre ?? ""}</Text>
            <TouchableOpacity
              className="py-3 rounded-xl bg-slate-800 border border-slate-600 mb-6"
              onPress={copiarDetalleEntreno}
              activeOpacity={0.85}
            >
              <Text className="text-center text-emerald-400 font-semibold">Compartir detalle entreno</Text>
            </TouchableOpacity>
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
                      {s.peso} kg × {s.reps} reps
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
