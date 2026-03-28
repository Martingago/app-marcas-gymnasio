import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import { getEjerciciosConSeriesParaEntreno } from "@/services/rutina/rutinasService";
import {
  crearEntrenamientoConSeries,
  SerieRegistrada,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutSession">;

type SetRow = { reps: string; peso: string };
type ExState = { ejercicioId: number; nombre: string; sets: SetRow[] };

export default function WorkoutSessionScreen({ navigation, route }: Props) {
  const { rutinaDiaId, nombreRutina, nombreDia } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ejercicios, setEjercicios] = useState<ExState[]>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEjerciciosConSeriesParaEntreno(rutinaDiaId);
      const next: ExState[] = data.map((ej) => {
        const n = Math.max(ej.seriesPlantilla.length, 1);
        const sets: SetRow[] = Array.from({ length: n }, (_, i) => ({
          reps: ej.seriesPlantilla[i]?.reps ?? "10",
          peso: ej.seriesPlantilla[i]?.peso ?? "0",
        }));
        return { ejercicioId: ej.ejercicioId, nombre: ej.nombre, sets };
      });
      setEjercicios(next);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudieron cargar los ejercicios del día.");
    } finally {
      setLoading(false);
    }
  }, [rutinaDiaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const actualizarSet = (
    ei: number,
    si: number,
    campo: keyof SetRow,
    valor: string
  ) => {
    setEjercicios((prev) =>
      prev.map((ex, i) =>
        i !== ei
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, j) => (j === si ? { ...s, [campo]: valor } : s)),
            }
      )
    );
  };

  const agregarSerie = (ei: number) => {
    setEjercicios((prev) =>
      prev.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: [...ex.sets, { reps: "10", peso: "0" }] }
      )
    );
  };

  const quitarSerie = (ei: number, si: number) => {
    setEjercicios((prev) =>
      prev.map((ex, i) =>
        i !== ei
          ? ex
          : { ...ex, sets: ex.sets.filter((_, j) => j !== si || ex.sets.length <= 1) }
      )
    );
  };

  const guardar = async () => {
    const fechaISO = new Date().toISOString();
    const seriesRegistros: SerieRegistrada[] = [];

    for (const ex of ejercicios) {
      ex.sets.forEach((set, idx) => {
        const reps = parseInt(String(set.reps).trim(), 10);
        const peso = parseFloat(String(set.peso).replace(",", "."));
        if (!Number.isFinite(reps) || reps <= 0) return;
        seriesRegistros.push({
          ejercicioId: ex.ejercicioId,
          serieOrden: idx + 1,
          repeticiones: reps,
          peso: Number.isFinite(peso) ? peso : 0,
        });
      });
    }

    if (seriesRegistros.length === 0) {
      Alert.alert("Sin datos", "Introduce al menos una serie con repeticiones válidas.");
      return;
    }

    setSaving(true);
    try {
      await crearEntrenamientoConSeries({
        rutinaDiaId,
        fechaISO,
        seriesRegistros,
      });
      Alert.alert("Guardado", "Entreno registrado correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar el entreno.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (ejercicios.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 p-4 justify-center">
        <Text className="text-slate-400 text-center">
          No hay ejercicios en este día. Configura la rutina antes de entrenar.
        </Text>
        <TouchableOpacity className="mt-6 bg-slate-800 p-4 rounded-xl" onPress={() => navigation.goBack()}>
          <Text className="text-white text-center font-bold">Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="text-slate-400 text-xs font-bold uppercase mb-1">{nombreRutina}</Text>
        <Text className="text-white text-2xl font-bold mb-1">{nombreDia}</Text>
        <Text className="text-slate-500 text-sm mb-6">Anota reps y peso por serie</Text>

        {ejercicios.map((ex, ei) => (
          <View key={`${ex.ejercicioId}-${ei}`} className="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-3">{ex.nombre}</Text>
            {ex.sets.map((set, si) => (
              <View key={si} className="flex-row items-center mb-2 gap-2">
                <Text className="text-slate-500 w-8 text-center font-bold">{si + 1}</Text>
                <TextInput
                  className="flex-1 bg-slate-900 text-white p-2 rounded-lg text-center"
                  keyboardType="numeric"
                  placeholder="Reps"
                  placeholderTextColor="#64748b"
                  value={set.reps}
                  onChangeText={(t) => actualizarSet(ei, si, "reps", t)}
                />
                <TextInput
                  className="flex-1 bg-slate-900 text-white p-2 rounded-lg text-center"
                  keyboardType="decimal-pad"
                  placeholder="Kg"
                  placeholderTextColor="#64748b"
                  value={set.peso}
                  onChangeText={(t) => actualizarSet(ei, si, "peso", t)}
                />
                <TouchableOpacity onPress={() => quitarSerie(ei, si)} className="px-2">
                  <Text className="text-red-400 text-lg">×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => agregarSerie(ei)} className="mt-2 py-2">
              <Text className="text-blue-400 text-center text-sm font-bold">+ Añadir serie</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View className="p-4 border-t border-slate-800 bg-slate-900">
        <TouchableOpacity
          className={`p-4 rounded-xl items-center ${saving ? "bg-emerald-800" : "bg-emerald-600"}`}
          onPress={guardar}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Finalizar y guardar entreno</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
