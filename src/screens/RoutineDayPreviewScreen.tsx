import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "@/navigation/types";
import { getEntrenoActivoRutina } from "@/services/entrenamientos/entrenamientosService";
import { getEjerciciosConSeriesParaEntreno } from "@/services/rutina/rutinasService";

type Props = NativeStackScreenProps<RootStackParamList, "RoutineDayPreview">;

export default function RoutineDayPreviewScreen({ navigation, route }: Props) {
  const { rutinaId, rutinaDiaId, nombreRutina, nombreDia } = route.params;
  const [loading, setLoading] = useState(true);
  const [ejercicios, setEjercicios] = useState<Awaited<ReturnType<typeof getEjerciciosConSeriesParaEntreno>>>([]);
  const [entrenoActivo, setEntrenoActivo] = useState<Awaited<
    ReturnType<typeof getEntrenoActivoRutina>
  > | null>(null);
  /** true = ejercicio plegado (solo título y resumen breve). */
  const [collapsedEjercicios, setCollapsedEjercicios] = useState<Record<number, boolean>>({});

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [data, activo] = await Promise.all([
        getEjerciciosConSeriesParaEntreno(rutinaDiaId),
        getEntrenoActivoRutina(rutinaId),
      ]);
      setEjercicios(data);
      setEntrenoActivo(activo);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [rutinaDiaId, rutinaId]);

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
          ejercicios.map((ej, ei) => {
            const collapsed = !!collapsedEjercicios[ej.ejercicioId];
            const nSeries = ej.seriesPlantilla.length;
            return (
              <View key={`${ej.ejercicioId}-${ei}`} className="bg-slate-800/90 rounded-2xl p-4 mb-4 border border-slate-700">
                <Pressable
                  onPress={() =>
                    setCollapsedEjercicios((m) => ({ ...m, [ej.ejercicioId]: !m[ej.ejercicioId] }))
                  }
                  className="flex-row items-start justify-between gap-2 active:opacity-90"
                >
                  <View className="flex-1 min-w-0 pr-1">
                    <Text className="text-white text-lg font-bold">{ej.nombre}</Text>
                    {collapsed ? (
                      <Text className="text-slate-500 text-xs mt-1.5">
                        {nSeries === 0
                          ? "Sin series en plantilla"
                          : `${nSeries} ${nSeries === 1 ? "serie objetivo" : "series objetivo"}`}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={collapsed ? "chevron-down" : "chevron-up"}
                    size={22}
                    color="#94a3b8"
                    style={{ marginTop: 2 }}
                  />
                </Pressable>

                {!collapsed ? (
                  <View className="mt-3">
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
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <View className="p-4 border-t border-slate-800 bg-slate-900">
        {entrenoActivo &&
        entrenoActivo.rutinaDiaId != null &&
        entrenoActivo.rutinaDiaId !== rutinaDiaId ? (
          <View className="bg-amber-900/35 border border-amber-600/45 rounded-xl p-3 mb-4">
            <Text className="text-amber-200 font-bold text-sm mb-1">No puedes iniciar este día ahora</Text>
            <Text className="text-amber-100/90 text-sm leading-5">
              Ya tienes un día de entreno en curso («{entrenoActivo.nombreDia ?? "—"}»). Finalízalo antes de abrir
              otra sesión. Arriba puedes seguir viendo lo planificado para este día.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          className={`py-4 rounded-xl items-center border ${
            entrenoActivo &&
            entrenoActivo.rutinaDiaId != null &&
            entrenoActivo.rutinaDiaId !== rutinaDiaId
              ? "bg-slate-700 border-slate-600 opacity-60"
              : "bg-blue-600 border-blue-500/40"
          }`}
          disabled={
            !!(
              entrenoActivo &&
              entrenoActivo.rutinaDiaId != null &&
              entrenoActivo.rutinaDiaId !== rutinaDiaId
            )
          }
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
          <Text className="text-white font-bold text-lg">
            {entrenoActivo?.rutinaDiaId === rutinaDiaId
              ? "Continuar día de entreno"
              : "Iniciar día de entreno"}
          </Text>
        </TouchableOpacity>
        <Text className="text-slate-500 text-xs text-center mt-3 leading-4">
          {entrenoActivo?.rutinaDiaId === rutinaDiaId
            ? "Vuelves a la sesión donde se guardan tus series (sigue abierta hasta que pulses finalizar)."
            : "Solo entonces se abre la sesión donde podrás anotar lo que hagas (guardado automático)."}
        </Text>
      </View>
    </SafeAreaView>
  );
}
