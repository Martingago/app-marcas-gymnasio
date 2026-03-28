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

function comparativaObjetivoReal(
  plant: { reps: string; peso: string } | undefined,
  rRep: number,
  rPeso: number
): { texto: string; ok: boolean } | null {
  if (!plant) return null;
  const oR = parseInt(String(plant.reps).trim(), 10);
  const oP = parseFloat(String(plant.peso).replace(",", "."));
  if (!Number.isFinite(oR) || oR <= 0 || !Number.isFinite(oP)) return null;
  const repsOk = rRep >= oR;
  const pesoOk = rPeso >= oP - 0.01;
  if (repsOk && pesoOk) {
    return { texto: "Objetivo alcanzado o superado.", ok: true };
  }
  const p: string[] = [];
  if (!repsOk) p.push(`reps por debajo del objetivo (${rRep} / ${oR})`);
  if (!pesoOk) p.push(`peso por debajo del objetivo (${rPeso} / ${oP})`);
  return { texto: p.join(" · "), ok: false };
}

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

  const rTry = parseInt(String(reps).trim(), 10);
  const pTry = parseFloat(String(peso).replace(",", "."));
  const effRep = Number.isFinite(rTry) && rTry > 0 ? rTry : row.repeticiones;
  const effPeso = Number.isFinite(pTry) ? pTry : row.peso;
  const comp = objetivoMeta ? comparativaObjetivoReal(objetivoMeta, effRep, effPeso) : null;

  return (
    <View className="mb-2">
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
      {objetivoMeta ? (
        <Text className="text-slate-500 text-xs mt-1 ml-1">
          Objetivo: {objetivoMeta.reps} reps · {objetivoMeta.peso} kg · Registrado: {effRep} reps · {effPeso} kg
        </Text>
      ) : null}
      {comp ? (
        <Text className={`text-xs mt-1 ml-1 ${comp.ok ? "text-emerald-400" : "text-amber-400/90"}`}>{comp.texto}</Text>
      ) : null}
    </View>
  );
}

function SlotSinRegistrar({
  orden,
  plant,
  editable,
  onRegistrar,
}: {
  orden: number;
  plant: { reps: string; peso: string };
  editable: boolean;
  onRegistrar: () => void;
}) {
  return (
    <View className="mb-4 bg-slate-900/50 border border-dashed border-slate-600 rounded-xl p-3">
      <Text className="text-slate-500 text-xs mb-1">Serie {orden}</Text>
      <Text className="text-amber-400/95 font-bold text-base mb-1">
        Objetivo de la rutina: {plant.reps} reps · {plant.peso} kg
      </Text>
      <Text className="text-slate-400 text-sm leading-5 mb-3">
        Tu objetivo para esta serie es de {plant.reps} repeticiones y {plant.peso} kg. Cuando la completes, registra lo
        que hayas hecho en realidad.
      </Text>
      {editable ? (
        <TouchableOpacity className="bg-slate-700 py-3 rounded-lg border border-slate-600" onPress={onRegistrar} activeOpacity={0.85}>
          <Text className="text-white text-center font-bold">Registrar esta serie</Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-slate-600 text-sm">No registrada.</Text>
      )}
    </View>
  );
}

export default function WorkoutSessionScreen({ navigation, route }: Props) {
  const { rutinaId, rutinaDiaId, nombreRutina, nombreDia } = route.params;
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
            "Ya tienes un entreno sin finalizar en otro día de esta rutina.",
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

  const objetivoParaOrden = (ej: EjercicioUi, orden: number) => {
    const idx = orden - 1;
    const p = ej.seriesPlantilla[idx];
    if (!p) return null;
    return { reps: p.reps, peso: p.peso };
  };

  const registrarSeriePlantilla = async (ej: EjercicioUi, orden: number) => {
    if (!entrenamientoId || finalizado) return;
    const plant = ej.seriesPlantilla[orden - 1];
    const repeticiones = plant ? parseInt(String(plant.reps).trim(), 10) : 10;
    const pesoVal = plant ? parseFloat(String(plant.peso).replace(",", ".")) : 0;
    try {
      await añadirSerieAlEntrenamiento(entrenamientoId, ej.ejercicioId, {
        serieOrden: orden,
        repeticiones: Number.isFinite(repeticiones) && repeticiones > 0 ? repeticiones : 10,
        peso: Number.isFinite(pesoVal) ? pesoVal : 0,
      });
      await cargar();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo registrar la serie.");
    }
  };

  const añadirSerieExtra = async (ej: EjercicioUi) => {
    if (!entrenamientoId || finalizado) return;
    try {
      await añadirSerieAlEntrenamiento(entrenamientoId, ej.ejercicioId, {
        repeticiones: 10,
        peso: 0,
      });
      await cargar();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo añadir la serie.");
    }
  };

  const confirmarFinalizar = async () => {
    if (!entrenamientoId) return;
    setFinalizando(true);
    try {
      await finalizarEntrenamientoDia(entrenamientoId);
      setModalFinalizar(false);
      navigation.navigate("RoutineDayPicker", { rutinaId, nombreRutina });
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

        {ejercicios.map((ex, ei) => {
          const extras = ex.series
            .filter((s) => s.serieOrden > ex.seriesPlantilla.length)
            .sort((a, b) => a.serieOrden - b.serieOrden);

          return (
            <View key={`${ex.ejercicioId}-${ei}`} className="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-slate-700">
              <Text className="text-white text-lg font-bold mb-2">{ex.nombre}</Text>

              {ex.seriesPlantilla.map((plant, idx) => {
                const orden = idx + 1;
                const real = ex.series.find((s) => s.serieOrden === orden);
                const meta = { reps: plant.reps, peso: plant.peso };

                return (
                  <View key={`slot-${orden}`} className="mb-1">
                    {!real ? (
                      <SlotSinRegistrar
                        orden={orden}
                        plant={plant}
                        editable={editable}
                        onRegistrar={() => void registrarSeriePlantilla(ex, orden)}
                      />
                    ) : (
                      <>
                        <Text className="text-slate-500 text-xs mb-1 ml-1">Serie {orden}</Text>
                        <Text className="text-amber-500/95 text-xs font-semibold mb-1 ml-1">
                          Objetivo rutina: {meta.reps} reps · {meta.peso} kg
                        </Text>
                        <SerieRowEditor
                          row={real}
                          objetivoMeta={meta}
                          editable={editable}
                          onRemoved={() => void cargar()}
                        />
                      </>
                    )}
                  </View>
                );
              })}

              {extras.map((row) => {
                const meta = objetivoParaOrden(ex, row.serieOrden);
                return (
                  <View key={`extra-${row.id}`}>
                    <Text className="text-slate-500 text-xs mb-1 ml-1 mt-2">Serie extra {row.serieOrden}</Text>
                    {meta ? (
                      <Text className="text-amber-500/90 text-xs mb-1 ml-1">
                        Objetivo rutina (si aplica): {meta.reps} reps · {meta.peso} kg
                      </Text>
                    ) : (
                      <Text className="text-slate-500 text-xs mb-1 ml-1">Serie adicional</Text>
                    )}
                    <SerieRowEditor
                      row={row}
                      objetivoMeta={meta}
                      editable={editable}
                      onRemoved={() => void cargar()}
                    />
                  </View>
                );
              })}

              {editable ? (
                <TouchableOpacity
                  className="mt-3 py-3 bg-blue-600/90 rounded-xl border border-blue-500/50"
                  onPress={() => void añadirSerieExtra(ex)}
                  activeOpacity={0.85}
                >
                  <Text className="text-white text-center font-bold">+ Añadir serie extra</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
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
              los ejercicios. Volverás a la lista de días con el siguiente día recomendado actualizado.
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
