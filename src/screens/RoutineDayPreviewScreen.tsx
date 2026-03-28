import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import { getEjerciciosConSeriesParaEntreno } from "@/services/rutina/rutinasService";

type Props = NativeStackScreenProps<RootStackParamList, "RoutineDayPreview">;

export default function RoutineDayPreviewScreen({ navigation, route }: Props) {
  const { rutinaId, rutinaDiaId, nombreRutina, nombreDia } = route.params;
  const [loading, setLoading] = useState(true);
  const [ejercicios, setEjercicios] = useState<Awaited<ReturnType<typeof getEjerciciosConSeriesParaEntreno>>>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEjerciciosConSeriesParaEntreno(rutinaDiaId);
      setEjercicios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [rutinaDiaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="text-slate-400 text-xs font-bold uppercase mb-1">{nombreRutina}</Text>
        <Text className="text-white text-2xl font-bold mb-2">{nombreDia}</Text>
        <Text className="text-slate-500 text-sm mb-6 leading-5">
          Aquí ves lo que tienes planificado en la rutina. Pulsa el botón inferior cuando quieras empezar a registrar
          series reales (se creará la sesión de entreno).
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
        ) : ejercicios.length === 0 ? (
          <Text className="text-slate-500 text-center">Este día no tiene ejercicios configurados.</Text>
        ) : (
          ejercicios.map((ej, ei) => (
            <View key={`${ej.ejercicioId}-${ei}`} className="bg-slate-800/90 rounded-2xl p-4 mb-4 border border-slate-700">
              <Text className="text-white text-lg font-bold mb-3">{ej.nombre}</Text>
              {ej.seriesPlantilla.length === 0 ? (
                <Text className="text-slate-500 text-sm">Sin series objetivo en la plantilla.</Text>
              ) : (
                ej.seriesPlantilla.map((s, si) => (
                  <View key={si} className="bg-slate-900/60 p-3 rounded-xl mb-2 border border-slate-700/80">
                    <Text className="text-slate-500 text-xs mb-1">Serie {si + 1}</Text>
                    <Text className="text-amber-400/95 text-base font-semibold">
                      {s.reps} reps · {s.peso} kg
                    </Text>
                    <Text className="text-slate-500 text-xs mt-1">Objetivo de la rutina (referencia)</Text>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View className="p-4 border-t border-slate-800 bg-slate-900">
        <TouchableOpacity
          className="py-4 bg-blue-600 rounded-xl items-center border border-blue-500/40"
          onPress={() =>
            navigation.navigate("WorkoutSession", {
              rutinaId,
              rutinaDiaId,
              nombreRutina,
              nombreDia,
            })
          }
          activeOpacity={0.9}
        >
          <Text className="text-white font-bold text-lg">Iniciar día de entreno</Text>
        </TouchableOpacity>
        <Text className="text-slate-500 text-xs text-center mt-3 leading-4">
          Solo entonces se abre la sesión donde podrás anotar lo que hagas (guardado automático).
        </Text>
      </View>
    </SafeAreaView>
  );
}
