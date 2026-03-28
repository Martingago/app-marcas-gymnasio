import React, { useCallback, useEffect, useRef, useState } from "react";
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
  actualizarSerieRealizada,
  añadirSerieAlEntrenamiento,
  eliminarSerieRealizada,
  fechaLocalHoy,
  getOrCreateEntrenamientoDelDia,
  getSeriesDelEntrenamiento,
  SerieRealizadaRow,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutSession">;

type EjercicioUi = {
  ejercicioId: number;
  nombre: string;
  orden: number;
  series: SerieRealizadaRow[];
};

function SerieRowEditor({
  row,
  onRemoved,
}: {
  row: SerieRealizadaRow;
  onRemoved: () => void;
}) {
  const [reps, setReps] = useState(String(row.repeticiones));
  const [peso, setPeso] = useState(String(row.peso));
  const [syncing, setSyncing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const omitirSiguientePersist = useRef(true);

  useEffect(() => {
    omitirSiguientePersist.current = true;
  }, [row.id]);

  useEffect(() => {
    setReps(String(row.repeticiones));
    setPeso(String(row.peso));
  }, [row.id, row.repeticiones, row.peso]);

  const persist = useCallback(async () => {
    const r = parseInt(String(reps).trim(), 10);
    const p = parseFloat(String(peso).replace(",", "."));
    if (!Number.isFinite(r) || r <= 0) return;
    setSyncing(true);
    try {
      await actualizarSerieRealizada(row.id, r, Number.isFinite(p) ? p : 0);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  }, [reps, peso, row.id]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (omitirSiguientePersist.current) {
        omitirSiguientePersist.current = false;
        return;
      }
      void persist();
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reps, peso, persist]);

  const confirmarBorrar = () => {
    Alert.alert("Quitar serie", "¿Eliminar esta serie del entreno?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await eliminarSerieRealizada(row.id);
            onRemoved();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-row items-center mb-2 gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-700/80">
      <View className="w-9 items-center">
        <Text className="text-slate-500 font-bold text-sm">{row.serieOrden}</Text>
        {syncing ? <ActivityIndicator size="small" color="#64748b" style={{ marginTop: 2 }} /> : null}
      </View>
      <TextInput
        className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px]"
        keyboardType="number-pad"
        placeholder="Reps"
        placeholderTextColor="#64748b"
        value={reps}
        onChangeText={setReps}
        onBlur={() => void persist()}
      />
      <TextInput
        className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px]"
        keyboardType="decimal-pad"
        placeholder="Kg"
        placeholderTextColor="#64748b"
        value={peso}
        onChangeText={setPeso}
        onBlur={() => void persist()}
      />
      <TouchableOpacity onPress={confirmarBorrar} className="px-2 py-1" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text className="text-red-400 text-xl leading-none">×</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WorkoutSessionScreen({ navigation, route }: Props) {
  const { rutinaDiaId, nombreRutina, nombreDia } = route.params;
  const [loading, setLoading] = useState(true);
  const [entrenamientoId, setEntrenamientoId] = useState<number | null>(null);
  const [fechaSesion, setFechaSesion] = useState(fechaLocalHoy());
  const [ejercicios, setEjercicios] = useState<EjercicioUi[]>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const template = await getEjerciciosConSeriesParaEntreno(rutinaDiaId);
      if (template.length === 0) {
        setEjercicios([]);
        setEntrenamientoId(null);
        return;
      }

      const entId = await getOrCreateEntrenamientoDelDia(rutinaDiaId);
      setEntrenamientoId(entId);
      setFechaSesion(fechaLocalHoy());

      const todas = await getSeriesDelEntrenamiento(entId);

      const merged: EjercicioUi[] = template.map((ej) => ({
        ejercicioId: ej.ejercicioId,
        nombre: ej.nombre,
        orden: ej.orden,
        series: todas.filter((s) => s.ejercicioId === ej.ejercicioId),
      }));

      setEjercicios(merged);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cargar el entreno.");
    } finally {
      setLoading(false);
    }
  }, [rutinaDiaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  const añadirSerie = async (ejercicioId: number) => {
    if (!entrenamientoId) return;
    try {
      await añadirSerieAlEntrenamiento(entrenamientoId, ejercicioId);
      await cargar();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo añadir la serie.");
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

  const fechaLegible = (() => {
    const [y, m, d] = fechaSesion.split("-").map(Number);
    if (!y || !m || !d) return fechaSesion;
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  })();

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-slate-800/90 border border-slate-600 rounded-2xl p-4 mb-5">
          <Text className="text-slate-400 text-xs font-bold uppercase mb-1">{nombreRutina}</Text>
          <Text className="text-white text-2xl font-bold mb-1">{nombreDia}</Text>
          <Text className="text-slate-500 text-sm capitalize mb-3">{fechaLegible}</Text>
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text className="text-emerald-400/90 text-sm flex-1">
              Cada serie se guarda sola. Puedes cerrar la app y seguir más tarde.
            </Text>
          </View>
        </View>

        {ejercicios.map((ex, ei) => (
          <View key={`${ex.ejercicioId}-${ei}`} className="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-1">{ex.nombre}</Text>
            <Text className="text-slate-500 text-xs mb-3">
              {ex.series.length === 0
                ? "Aún no has registrado series. Pulsa el botón cuando termines una."
                : `${ex.series.length} serie${ex.series.length === 1 ? "" : "s"} registrada${ex.series.length === 1 ? "" : "s"}`}
            </Text>

            {ex.series.map((row) => (
              <SerieRowEditor key={row.id} row={row} onRemoved={() => void cargar()} />
            ))}

            <TouchableOpacity
              className="mt-3 py-3 bg-blue-600/90 rounded-xl border border-blue-500/50"
              onPress={() => void añadirSerie(ex.ejercicioId)}
              activeOpacity={0.85}
            >
              <Text className="text-white text-center font-bold">+ Registrar serie hecha</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
