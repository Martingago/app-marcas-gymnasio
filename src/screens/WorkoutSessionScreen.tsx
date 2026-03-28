import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
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
  eliminarEntrenamientoFinalizado,
  esErrorOtroDiaActivo,
  fechaLocalHoy,
  finalizarEntrenamientoDia,
  getEntrenamientoCabecera,
  getOrCreateSesionActivaParaDia,
  getSeriesDelEntrenamiento,
  SerieRealizadaRow,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutSession">;

type EjercicioUi = {
  ejercicioId: number;
  nombre: string;
  orden: number;
  seriesPlantilla: { reps: string; peso: string }[];
  series: SerieRealizadaRow[];
};

function SerieRowEditor({
  row,
  objetivoMeta,
  editable,
  onRemoved,
}: {
  row: SerieRealizadaRow;
  objetivoMeta?: { reps: string; peso: string } | null;
  editable: boolean;
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
    if (!editable) return;
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
  }, [reps, peso, row.id, editable]);

  useEffect(() => {
    if (!editable) return;
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
  }, [reps, peso, persist, editable]);

  const confirmarBorrar = () => {
    if (!editable) return;
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
            Alert.alert("No se puede editar", "Este día ya está finalizado.");
          }
        },
      },
    ]);
  };

  return (
    <View className="mb-2">
      {objetivoMeta ? (
        <Text className="text-amber-500/90 text-xs mb-1 ml-1">
          Objetivo: {objetivoMeta.reps} reps · {objetivoMeta.peso} kg
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-700/80">
        <View className="w-9 items-center">
          <Text className="text-slate-500 font-bold text-sm">{row.serieOrden}</Text>
          {syncing && editable ? (
            <ActivityIndicator size="small" color="#64748b" style={{ marginTop: 2 }} />
          ) : null}
        </View>
        {editable ? (
          <>
            <TextInput
              className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px]"
              keyboardType="number-pad"
              placeholder={objetivoMeta?.reps ?? "Reps"}
              placeholderTextColor="#78716c"
              value={reps}
              onChangeText={setReps}
              onBlur={() => void persist()}
            />
            <TextInput
              className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px]"
              keyboardType="decimal-pad"
              placeholder={objetivoMeta?.peso ?? "Kg"}
              placeholderTextColor="#78716c"
              value={peso}
              onChangeText={setPeso}
              onBlur={() => void persist()}
            />
            <TouchableOpacity onPress={confirmarBorrar} className="px-2 py-1" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-red-400 text-xl leading-none">×</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="flex-1 bg-slate-800/50 p-2 rounded-lg items-center justify-center min-h-[44px] border border-slate-700">
              <Text className="text-white font-semibold">{reps} reps</Text>
            </View>
            <View className="flex-1 bg-slate-800/50 p-2 rounded-lg items-center justify-center min-h-[44px] border border-slate-700">
              <Text className="text-white font-semibold">{peso} kg</Text>
            </View>
            <View className="w-8" />
          </>
        )}
      </View>
    </View>
  );
}

export default function WorkoutSessionScreen({ navigation, route }: Props) {
  const { rutinaDiaId, nombreRutina, nombreDia } = route.params;
  const [loading, setLoading] = useState(true);
  const [entrenamientoId, setEntrenamientoId] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [fechaSesion, setFechaSesion] = useState(fechaLocalHoy());
  const [ejercicios, setEjercicios] = useState<EjercicioUi[]>([]);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const template = await getEjerciciosConSeriesParaEntreno(rutinaDiaId);
      if (template.length === 0) {
        setEjercicios([]);
        setEntrenamientoId(null);
        setFinalizado(false);
        return;
      }

      let entId: number;
      try {
        entId = await getOrCreateSesionActivaParaDia(rutinaDiaId);
      } catch (e) {
        if (esErrorOtroDiaActivo(e)) {
          Alert.alert(
            "Otro día en curso",
            "Ya tienes un entreno sin finalizar en otro día de esta rutina. Ábrelo, finalízalo o revisa el día recomendado desde la lista.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
          return;
        }
        throw e;
      }

      const cab = await getEntrenamientoCabecera(entId);
      setEntrenamientoId(entId);
      setFinalizado(cab?.finalizado === 1);
      setFechaSesion(cab?.fecha ?? fechaLocalHoy());

      const todas = await getSeriesDelEntrenamiento(entId);

      const merged: EjercicioUi[] = template.map((ej) => ({
        ejercicioId: ej.ejercicioId,
        nombre: ej.nombre,
        orden: ej.orden,
        seriesPlantilla: ej.seriesPlantilla,
        series: todas.filter((s) => s.ejercicioId === ej.ejercicioId),
      }));

      setEjercicios(merged);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cargar el entreno.");
    } finally {
      setLoading(false);
    }
  }, [rutinaDiaId, navigation]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  const objetivoParaSerie = (ej: EjercicioUi, serieOrden: number) => {
    const idx = serieOrden - 1;
    const p = ej.seriesPlantilla[idx];
    if (!p) return null;
    return { reps: p.reps, peso: p.peso };
  };

  const añadirSerie = async (ej: EjercicioUi) => {
    if (!entrenamientoId || finalizado) return;
    const idx = ej.series.length;
    const plant = ej.seriesPlantilla[idx];
    const repeticiones = plant ? parseInt(String(plant.reps).trim(), 10) : 10;
    const pesoVal = plant ? parseFloat(String(plant.peso).replace(",", ".")) : 0;
    try {
      await añadirSerieAlEntrenamiento(entrenamientoId, ej.ejercicioId, {
        repeticiones: Number.isFinite(repeticiones) && repeticiones > 0 ? repeticiones : 10,
        peso: Number.isFinite(pesoVal) ? pesoVal : 0,
      });
      await cargar();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "";
      if (msg === "SESION_FINALIZADA") {
        Alert.alert("Sesión cerrada", "Este día ya está finalizado.");
      } else {
        Alert.alert("Error", "No se pudo añadir la serie.");
      }
    }
  };

  const confirmarFinalizar = async () => {
    if (!entrenamientoId) return;
    setFinalizando(true);
    try {
      await finalizarEntrenamientoDia(entrenamientoId);
      setModalFinalizar(false);
      await cargar();
      Alert.alert(
        "Día finalizado",
        "Ya no podrás editar este entreno. El siguiente día recomendado se actualizará según lo que acabas de completar."
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo finalizar el día.");
    } finally {
      setFinalizando(false);
    }
  };

  const confirmarEliminarEntreno = () => {
    if (!entrenamientoId) return;
    Alert.alert(
      "Eliminar entreno",
      "Se borrará este registro del historial (todas las series). ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarEntrenamientoFinalizado(entrenamientoId);
              navigation.goBack();
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Solo se pueden eliminar entrenos ya finalizados.");
            }
          },
        },
      ]
    );
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

  const editable = !finalizado;

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 160 }}>
        <View className="bg-slate-800/90 border border-slate-600 rounded-2xl p-4 mb-5">
          <Text className="text-slate-400 text-xs font-bold uppercase mb-1">{nombreRutina}</Text>
          <Text className="text-white text-2xl font-bold mb-1">{nombreDia}</Text>
          <Text className="text-slate-500 text-sm capitalize mb-3">{fechaLegible}</Text>
          {finalizado ? (
            <View className="bg-slate-700/80 px-3 py-2 rounded-lg border border-slate-600 mb-2">
              <Text className="text-slate-300 text-sm font-semibold">Día finalizado · solo lectura</Text>
              <Text className="text-slate-500 text-xs mt-1">Puedes eliminar el registro completo si lo necesitas.</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-emerald-400/90 text-sm flex-1">
                Los objetivos en ámbar son la meta de la rutina. Lo que escribes es tu registro real (se guarda solo).
              </Text>
            </View>
          )}
        </View>

        {ejercicios.map((ex, ei) => (
          <View key={`${ex.ejercicioId}-${ei}`} className="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-1">{ex.nombre}</Text>
            {ex.seriesPlantilla.length > 0 ? (
              <Text className="text-slate-500 text-xs mb-2">
                Meta de la rutina: {ex.seriesPlantilla.length} serie{ex.seriesPlantilla.length === 1 ? "" : "s"} planificada
                {ex.seriesPlantilla.length === 1 ? "" : "s"} (referencia, no obligatorio completarlas todas).
              </Text>
            ) : null}
            <Text className="text-slate-500 text-xs mb-3">
              {ex.series.length === 0
                ? "Registra cada serie cuando la completes."
                : `${ex.series.length} serie${ex.series.length === 1 ? "" : "s"} anotada${ex.series.length === 1 ? "" : "s"}`}
            </Text>

            {ex.series.map((row) => (
              <SerieRowEditor
                key={row.id}
                row={row}
                editable={editable}
                objetivoMeta={objetivoParaSerie(ex, row.serieOrden)}
                onRemoved={() => void cargar()}
              />
            ))}

            {editable ? (
              <TouchableOpacity
                className="mt-3 py-3 bg-blue-600/90 rounded-xl border border-blue-500/50"
                onPress={() => void añadirSerie(ex)}
                activeOpacity={0.85}
              >
                <Text className="text-white text-center font-bold">+ Registrar serie hecha</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View className="p-4 border-t border-slate-800 bg-slate-900 gap-3">
        {editable ? (
          <TouchableOpacity
            className="py-4 bg-amber-600 rounded-xl items-center border border-amber-500/50"
            onPress={() => setModalFinalizar(true)}
            activeOpacity={0.9}
          >
            <Text className="text-slate-900 font-bold text-base">Finalizar día de entreno</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="py-4 bg-red-900/40 rounded-xl items-center border border-red-600/40"
            onPress={confirmarEliminarEntreno}
            activeOpacity={0.9}
          >
            <Text className="text-red-300 font-bold text-base">Eliminar este entreno del historial</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalFinalizar} transparent animationType="fade" onRequestClose={() => setModalFinalizar(false)}>
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">¿Finalizar este día?</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-6">
              Al confirmar, este entreno quedará cerrado y no podrás editar series. No hace falta haber completado todos
              los ejercicios. El siguiente día recomendado se basará en el último día finalizado (orden de la rutina).
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-3 rounded-xl bg-slate-700" onPress={() => setModalFinalizar(false)}>
                <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-amber-600"
                disabled={finalizando}
                onPress={() => void confirmarFinalizar()}
              >
                {finalizando ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text className="text-slate-900 text-center font-bold">Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
