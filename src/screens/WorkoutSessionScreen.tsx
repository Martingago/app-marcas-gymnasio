import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { formatoFechaDMY, formatoFechaTituloExtendido } from "@/lib/fechaFormato";
import AppDialog, { AppDialogAction } from "@/components/ui/AppDialog";
import { resetStackToRoutineDayPicker } from "@/navigation/resetToRoutineDayPicker";
import { RootStackParamList } from "@/navigation/types";
import { getEjerciciosConSeriesParaEntreno } from "@/services/rutina/rutinasService";
import {
  actualizarSerieRealizada,
  añadirDropsetTrasSerie,
  añadirSerieAlEntrenamiento,
  eliminarSerieRealizada,
  eliminarEntrenamientoFinalizado,
  esErrorOtroDiaActivo,
  fechaLocalHoy,
  cancelarEntrenamientoActivo,
  finalizarEntrenamientoDia,
  getEntrenamientoCabecera,
  getEjerciciosMinimizadosEnSesion,
  getOrCreateSesionActivaParaDia,
  getSeriesDelEntrenamiento,
  persistEjercicioSesionMinimizado,
  SerieRealizadaRow,
} from "@/services/entrenamientos/entrenamientosService";
import { parsePesoNoNegativo, sanitizePesoInput, sanitizeRepsInput } from "@/lib/inputNumeric";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutSession">;

type EjercicioUi = {
  ejercicioId: number;
  nombre: string;
  orden: number;
  seriesPlantilla: { reps: string; peso: string }[];
  series: SerieRealizadaRow[];
};

/** Series de plantilla (1..N) con al menos una fila principal registrada. */
function countSeriesPlantillaCompletadas(ex: EjercicioUi): { done: number; total: number } {
  const total = ex.seriesPlantilla.length;
  let done = 0;
  for (let o = 1; o <= total; o++) {
    const main = ex.series.find((s) => s.serieOrden === o && (s.esDropset ?? 0) === 0);
    if (main) done++;
  }
  return { done, total };
}

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
  onAskDelete,
}: {
  row: SerieRealizadaRow;
  /** Solo la serie principal se compara con el objetivo de la rutina */
  objetivoMeta?: { reps: string; peso: string } | null;
  editable: boolean;
  onRemoved: () => void;
  onAskDelete: () => void;
}) {
  const esDropset = (row.esDropset ?? 0) === 1;
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
    const p = parsePesoNoNegativo(peso);
    if (!Number.isFinite(r) || r <= 0) return;
    setSyncing(true);
    try {
      await actualizarSerieRealizada(row.id, r, p);
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
    onAskDelete();
  };

  const rTry = parseInt(String(reps).trim(), 10);
  const pTry = parsePesoNoNegativo(peso);
  const effRep = Number.isFinite(rTry) && rTry > 0 ? rTry : row.repeticiones;
  const effPeso = Number.isFinite(pTry) ? pTry : row.peso;
  const comp = !esDropset && objetivoMeta ? comparativaObjetivoReal(objetivoMeta, effRep, effPeso) : null;

  return (
    <View className="mb-2">
      <View
        className={`flex-row items-center gap-2 bg-slate-900/60 p-2 rounded-xl border ${
          esDropset ? "border-violet-600/45" : "border-slate-700/80"
        }`}
      >
        <View className="w-9 items-center">
          <Text className={`font-bold text-sm ${esDropset ? "text-violet-400" : "text-slate-500"}`}>
            {esDropset ? "↓" : row.serieOrden}
          </Text>
          {syncing && editable ? (
            <ActivityIndicator size="small" color="#64748b" style={{ marginTop: 2 }} />
          ) : null}
        </View>
        {editable ? (
          <>
            <TextInput
              className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px]"
              keyboardType="decimal-pad"
              placeholder={objetivoMeta?.peso ?? "Kg"}
              placeholderTextColor="#78716c"
              value={peso}
              selectTextOnFocus
              onChangeText={(t) => setPeso(sanitizePesoInput(t))}
              onBlur={() => void persist()}
            />
            <TextInput
              className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px]"
              keyboardType="number-pad"
              placeholder={objetivoMeta?.reps ?? "Reps"}
              placeholderTextColor="#78716c"
              value={reps}
              selectTextOnFocus
              onChangeText={(t) => setReps(sanitizeRepsInput(t))}
              onBlur={() => void persist()}
            />
            <TouchableOpacity onPress={confirmarBorrar} className="px-2 py-1" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-red-400 text-xl leading-none">×</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="flex-1 bg-slate-800/50 p-2 rounded-lg items-center justify-center min-h-[44px] border border-slate-700">
              <Text className="text-white font-semibold">{peso} kg</Text>
            </View>
            <View className="flex-1 bg-slate-800/50 p-2 rounded-lg items-center justify-center min-h-[44px] border border-slate-700">
              <Text className="text-white font-semibold">{reps} reps</Text>
            </View>
            <View className="w-8" />
          </>
        )}
      </View>
      {!esDropset && objetivoMeta ? (
        <Text className="text-slate-500 text-xs mt-1 ml-1">
          Objetivo: {objetivoMeta.peso} kg · {objetivoMeta.reps} reps · Registrado: {effPeso} kg · {effRep} reps
        </Text>
      ) : esDropset ? (
        <Text className="text-violet-400/80 text-xs mt-1 ml-1">Dropset: menos peso o más reps tras llegar al fallo.</Text>
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
        Objetivo de la rutina: {plant.peso} kg · {plant.reps} reps
      </Text>
      <Text className="text-slate-400 text-sm leading-5 mb-3">
        Tu objetivo para esta serie es de {plant.peso} kg y {plant.reps} repeticiones. Cuando la completes, registra lo
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

/**
 * Inputs de un dropset pendiente: mismo autoguardado por debounce que el resto de la sesión.
 * Misma fila que una serie (kg / reps) y × a la derecha para cerrar sin guardar.
 */
function DropsetPendingRow({
  entrenamientoId,
  ejercicioId,
  orden,
  editable,
  placeholderPeso,
  placeholderReps,
  onAdded,
  onError,
  onDismiss,
}: {
  entrenamientoId: number | null;
  ejercicioId: number;
  orden: number;
  editable: boolean;
  placeholderPeso?: string;
  placeholderReps?: string;
  onAdded: () => void;
  onError: (message: string) => void;
  onDismiss: () => void;
}) {
  const [peso, setPeso] = useState("");
  const [reps, setReps] = useState("");
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const onAddedRef = useRef(onAdded);
  const onErrorRef = useRef(onError);
  onAddedRef.current = onAdded;
  onErrorRef.current = onError;

  const attemptAdd = useCallback(async () => {
    if (!editable || !entrenamientoId || inFlightRef.current) return;
    const r = parseInt(String(reps).trim(), 10);
    const p = parsePesoNoNegativo(peso);
    if (!Number.isFinite(r) || r <= 0) return;
    inFlightRef.current = true;
    setBusy(true);
    try {
      await añadirDropsetTrasSerie(entrenamientoId, ejercicioId, orden, r, p);
      setPeso("");
      setReps("");
      onAddedRef.current();
    } catch (e) {
      onErrorRef.current(e instanceof Error ? e.message : "No se pudo añadir el dropset.");
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }, [editable, entrenamientoId, ejercicioId, orden, peso, reps]);

  useEffect(() => {
    if (!editable || !entrenamientoId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void attemptAdd();
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [peso, reps, editable, entrenamientoId, attemptAdd]);

  if (!editable || !entrenamientoId) return null;

  return (
    <View className="mb-2">
      <View className="flex-row items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-dashed border-violet-600/45">
        <View className="w-9 items-center justify-center min-h-[44px]">
          {busy ? (
            <ActivityIndicator size="small" color="#a78bfa" />
          ) : (
            <Text className="font-bold text-sm text-violet-400">↓</Text>
          )}
        </View>
        <TextInput
          className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px] border border-violet-900/45"
          keyboardType="decimal-pad"
          placeholder={placeholderPeso ?? "Kg"}
          placeholderTextColor="#6b21a8"
          value={peso}
          selectTextOnFocus
          editable={!busy}
          onChangeText={(t) => setPeso(sanitizePesoInput(t))}
        />
        <TextInput
          className="flex-1 bg-slate-800 text-white p-2 rounded-lg text-center min-h-[44px] border border-violet-900/45"
          keyboardType="number-pad"
          placeholder={placeholderReps ?? "Reps"}
          placeholderTextColor="#6b21a8"
          value={reps}
          selectTextOnFocus
          editable={!busy}
          onChangeText={(t) => setReps(sanitizeRepsInput(t))}
        />
        <TouchableOpacity
          onPress={() => {
            if (busy) return;
            setPeso("");
            setReps("");
            onDismiss();
          }}
          className="px-2 py-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={busy}
        >
          <Ionicons name="close" size={22} color="#f87171" />
        </TouchableOpacity>
      </View>
  
    </View>
  );
}

/** Botón «Añadir dropset»; al pulsar muestra la fila de entrada. Tras guardar uno, vuelve el botón para poder añadir otro. */
function DropsetAddSection({
  entrenamientoId,
  ejercicioId,
  orden,
  editable,
  placeholderPeso,
  placeholderReps,
  onAdded,
  onError,
}: {
  entrenamientoId: number | null;
  ejercicioId: number;
  orden: number;
  editable: boolean;
  placeholderPeso?: string;
  placeholderReps?: string;
  onAdded: () => void;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleAdded = useCallback(() => {
    setExpanded(false);
    onAdded();
  }, [onAdded]);

  if (!editable || !entrenamientoId) return null;

  return (
    <View className="mt-1 ml-1">
      {expanded ? (
        <DropsetPendingRow
          entrenamientoId={entrenamientoId}
          ejercicioId={ejercicioId}
          orden={orden}
          editable={editable}
          placeholderPeso={placeholderPeso}
          placeholderReps={placeholderReps}
          onAdded={handleAdded}
          onError={onError}
          onDismiss={() => setExpanded(false)}
        />
      ) : (
        <TouchableOpacity
          className="py-2.5 px-3 rounded-xl border border-dashed border-violet-800/55 bg-violet-950/20 active:opacity-90"
          onPress={() => setExpanded(true)}
          activeOpacity={0.85}
        >
          <Text className="text-violet-300 text-center font-semibold">+ Añadir dropset</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function WorkoutSessionScreen({ navigation, route }: Props) {
  const { rutinaId, rutinaDiaId, nombreRutina, nombreDia } = route.params;
  const headerHeight = useHeaderHeight();
  const [loading, setLoading] = useState(true);
  const [entrenamientoId, setEntrenamientoId] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [fechaSesion, setFechaSesion] = useState(fechaLocalHoy());
  const [ejercicios, setEjercicios] = useState<EjercicioUi[]>([]);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [dialogApp, setDialogApp] = useState<{
    title: string;
    message: string;
    actions: AppDialogAction[];
  } | null>(null);
  const [serieDeleteId, setSerieDeleteId] = useState<number | null>(null);
  const [modalEliminarHistorial, setModalEliminarHistorial] = useState(false);
  /** true = ejercicio plegado (solo cabecera + resumen). */
  const [collapsedEjercicios, setCollapsedEjercicios] = useState<Record<number, boolean>>({});

  const onDropsetAddError = useCallback((message: string) => {
    setDialogApp({
      title: "Dropset",
      message,
      actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
    });
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const template = await getEjerciciosConSeriesParaEntreno(rutinaDiaId);
      if (template.length === 0) {
        setEjercicios([]);
        setEntrenamientoId(null);
        setFinalizado(false);
        setCollapsedEjercicios({});
        return;
      }

      let entId: number;
      try {
        entId = await getOrCreateSesionActivaParaDia(rutinaDiaId);
      } catch (e) {
        if (esErrorOtroDiaActivo(e)) {
          setDialogApp({
            title: "Otro día en curso",
            message: "Ya tienes un entreno sin finalizar en otro día de esta rutina.",
            actions: [
              {
                label: "OK",
                variant: "primary",
                onPress: () => {
                  setDialogApp(null);
                  navigation.goBack();
                },
              },
            ],
          });
          return;
        }
        throw e;
      }

      const cab = await getEntrenamientoCabecera(entId);
      setEntrenamientoId(entId);
      setFinalizado(cab?.finalizado === 1);
      setFechaSesion(cab?.fecha ?? fechaLocalHoy());

      const [todas, minimizados] = await Promise.all([
        getSeriesDelEntrenamiento(entId),
        getEjerciciosMinimizadosEnSesion(entId),
      ]);
      setCollapsedEjercicios(minimizados);

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
      setDialogApp({
        title: "Error",
        message: "No se pudo cargar el entreno.",
        actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
      });
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
    const pesoVal = plant ? parsePesoNoNegativo(String(plant.peso)) : 0;
    try {
      await añadirSerieAlEntrenamiento(entrenamientoId, ej.ejercicioId, {
        serieOrden: orden,
        repeticiones: Number.isFinite(repeticiones) && repeticiones > 0 ? repeticiones : 10,
        peso: pesoVal,
      });
      await cargar();
    } catch (e) {
      console.error(e);
      setDialogApp({
        title: "Error",
        message: "No se pudo registrar la serie.",
        actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
      });
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
      setDialogApp({
        title: "Error",
        message: "No se pudo añadir la serie.",
        actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
      });
    }
  };

  const confirmarFinalizar = async () => {
    if (!entrenamientoId) return;
    setFinalizando(true);
    try {
      await finalizarEntrenamientoDia(entrenamientoId);
      setModalFinalizar(false);
      resetStackToRoutineDayPicker(navigation, rutinaId, nombreRutina);
    } catch (e) {
      console.error(e);
      setDialogApp({
        title: "Error",
        message: "No se pudo finalizar el día.",
        actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
      });
    } finally {
      setFinalizando(false);
    }
  };

  const confirmarCancelarEntreno = async () => {
    if (!entrenamientoId) return;
    setCancelando(true);
    try {
      await cancelarEntrenamientoActivo(entrenamientoId);
      setModalCancelar(false);
      resetStackToRoutineDayPicker(navigation, rutinaId, nombreRutina);
    } catch (e) {
      console.error(e);
      setDialogApp({
        title: "Error",
        message: "No se pudo cancelar el entreno.",
        actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
      });
    } finally {
      setCancelando(false);
    }
  };

  const ejecutarEliminarEntrenoHistorial = async () => {
    if (!entrenamientoId) return;
    try {
      await eliminarEntrenamientoFinalizado(entrenamientoId);
      setModalEliminarHistorial(false);
      navigation.goBack();
    } catch (e) {
      console.error(e);
      setModalEliminarHistorial(false);
      setDialogApp({
        title: "Error",
        message: "Solo se pueden eliminar entrenos ya finalizados.",
        actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
      });
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

  const editable = !finalizado;

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
      <ScrollView
        className="flex-1 px-4 pt-2"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="bg-slate-800/90 border border-slate-600 rounded-2xl p-4 mb-5">
          <Text className="text-slate-400 text-xs font-bold uppercase mb-1">{nombreRutina}</Text>
          <Text className="text-white text-2xl font-bold mb-1">{nombreDia}</Text>
          <Text className="text-slate-400 text-sm mb-0.5">{formatoFechaTituloExtendido(fechaSesion)}</Text>
          <Text className="text-slate-500 text-xs mb-3">{formatoFechaDMY(fechaSesion)}</Text>
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
          const maxPlant = ex.seriesPlantilla.length;
          const ordenesExtra = [
            ...new Set(ex.series.filter((s) => s.serieOrden > maxPlant).map((s) => s.serieOrden)),
          ].sort((a, b) => a - b);
          const collapsed = !!collapsedEjercicios[ex.ejercicioId];
          const { done: seriesDone, total: seriesTotal } = countSeriesPlantillaCompletadas(ex);
          const resumenColor =
            seriesTotal === 0
              ? "text-slate-500"
              : seriesDone >= seriesTotal
                ? "text-emerald-400"
                : "text-amber-400";

          const renderBloqueSerie = (orden: number, meta: { reps: string; peso: string } | null, esExtra: boolean) => {
            const main = ex.series.find((s) => s.serieOrden === orden && (s.esDropset ?? 0) === 0);
            const dropsOrden = ex.series
              .filter((s) => s.serieOrden === orden && (s.esDropset ?? 0) === 1)
              .sort((a, b) => a.id - b.id);

            return (
              <View key={`bloque-${ex.ejercicioId}-${orden}`} className="mb-1">
                {!main ? (
                  <SlotSinRegistrar
                    orden={orden}
                    plant={meta ?? { reps: "10", peso: "0" }}
                    editable={editable}
                    onRegistrar={() => void registrarSeriePlantilla(ex, orden)}
                  />
                ) : (
                  <>
                    <Text className="text-slate-500 text-xs mb-1 ml-1">
                      {esExtra ? `Serie extra ${orden}` : `Serie ${orden}`}
                    </Text>
                    {meta ? (
                      <Text className="text-amber-500/95 text-xs font-semibold mb-1 ml-1">
                        Objetivo rutina{esExtra ? " (si aplica)" : ""}: {meta.peso} kg · {meta.reps} reps
                      </Text>
                    ) : (
                      <Text className="text-slate-500 text-xs mb-1 ml-1">Serie adicional</Text>
                    )}
                    <SerieRowEditor
                      row={main}
                      objetivoMeta={meta}
                      editable={editable}
                      onRemoved={() => void cargar()}
                      onAskDelete={() => setSerieDeleteId(main.id)}
                    />
                    {dropsOrden.map((ds) => (
                      <View key={ds.id} className="mt-1 ml-1">
                        <Text className="text-violet-400/90 text-[10px] font-bold uppercase mb-0.5">Dropset</Text>
                        <SerieRowEditor
                          row={ds}
                          objetivoMeta={null}
                          editable={editable}
                          onRemoved={() => void cargar()}
                          onAskDelete={() => setSerieDeleteId(ds.id)}
                        />
                      </View>
                    ))}
                    <DropsetAddSection
                      key={`drop-add-${ex.ejercicioId}-${orden}`}
                      entrenamientoId={entrenamientoId}
                      ejercicioId={ex.ejercicioId}
                      orden={orden}
                      editable={editable}
                      placeholderPeso={String(main.peso)}
                      placeholderReps={String(main.repeticiones)}
                      onAdded={() => void cargar()}
                      onError={onDropsetAddError}
                    />
                  </>
                )}
              </View>
            );
          };

          return (
            <View key={`${ex.ejercicioId}-${ei}`} className="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-slate-700">
              <Pressable
                onPress={() => {
                  const next = !collapsedEjercicios[ex.ejercicioId];
                  setCollapsedEjercicios((m) => ({ ...m, [ex.ejercicioId]: next }));
                  if (entrenamientoId != null) {
                    void persistEjercicioSesionMinimizado(entrenamientoId, ex.ejercicioId, next);
                  }
                }}
                className="flex-row items-start justify-between gap-2 active:opacity-90"
              >
                <View className="flex-1 min-w-0 pr-1">
                  <Text className="text-white text-lg font-bold">{ex.nombre}</Text>
                  {collapsed ? (
                    <Text className={`text-xs mt-1.5 font-semibold ${resumenColor}`}>
                      {seriesTotal === 0
                        ? "Sin series en la rutina"
                        : `Completadas: ${seriesDone}/${seriesTotal}`}
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
                <>
                  {ex.seriesPlantilla.map((plant, idx) => {
                    const orden = idx + 1;
                    const meta = { reps: plant.reps, peso: plant.peso };
                    return renderBloqueSerie(orden, meta, false);
                  })}

                  {ordenesExtra.map((orden) => {
                    const meta = objetivoParaOrden(ex, orden);
                    return renderBloqueSerie(orden, meta, true);
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
                </>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <View className="p-4 border-t border-slate-800 bg-slate-900 gap-3 shrink-0">
        {editable ? (
          <>
            <TouchableOpacity
              className="py-4 bg-amber-600 rounded-xl items-center border border-amber-500/50"
              onPress={() => setModalFinalizar(true)}
              activeOpacity={0.9}
            >
              <Text className="text-slate-900 font-bold text-base">Finalizar día de entreno</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-3 bg-slate-800 rounded-xl items-center border border-slate-600"
              onPress={() => setModalCancelar(true)}
              activeOpacity={0.9}
            >
              <Text className="text-slate-300 font-semibold text-base">Cancelar entreno</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            className="py-4 bg-red-900/40 rounded-xl items-center border border-red-600/40"
            onPress={() => setModalEliminarHistorial(true)}
            activeOpacity={0.9}
          >
            <Text className="text-red-300 font-bold text-base">Eliminar este entreno del historial</Text>
          </TouchableOpacity>
        )}
      </View>
      </KeyboardAvoidingView>

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

      <AppDialog
        visible={dialogApp != null}
        title={dialogApp?.title ?? ""}
        message={dialogApp?.message ?? ""}
        onRequestClose={() => setDialogApp(null)}
        actions={dialogApp?.actions ?? []}
      />

      <Modal
        visible={serieDeleteId != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSerieDeleteId(null)}
      >
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">Quitar serie</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-6">
              ¿Eliminar esta serie del entreno? Esta acción no se puede deshacer.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-3 rounded-xl bg-slate-700" onPress={() => setSerieDeleteId(null)}>
                <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-red-700"
                onPress={() => {
                  const id = serieDeleteId;
                  if (id == null) return;
                  void (async () => {
                    try {
                      await eliminarSerieRealizada(id);
                      setSerieDeleteId(null);
                      await cargar();
                    } catch (err) {
                      console.error(err);
                      setSerieDeleteId(null);
                      setDialogApp({
                        title: "No se puede editar",
                        message: "Este día ya está finalizado o no se pudo eliminar la serie.",
                        actions: [{ label: "Entendido", onPress: () => setDialogApp(null) }],
                      });
                    }
                  })();
                }}
              >
                <Text className="text-white text-center font-bold">Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalEliminarHistorial}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminarHistorial(false)}
      >
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">Eliminar entreno</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-6">
              Se borrará este registro del historial (todas las series). ¿Continuar?
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-slate-700"
                onPress={() => setModalEliminarHistorial(false)}
              >
                <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-red-700"
                onPress={() => void ejecutarEliminarEntrenoHistorial()}
              >
                <Text className="text-white text-center font-bold">Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalCancelar} transparent animationType="fade" onRequestClose={() => setModalCancelar(false)}>
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">¿Cancelar este entreno?</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-6">
              Se borrará por completo esta sesión en curso (todas las series anotadas) y no quedará en el historial. El día
              recomendado volverá a calcularse según el último día que hayas finalizado antes.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-3 rounded-xl bg-slate-700" onPress={() => setModalCancelar(false)}>
                <Text className="text-slate-200 text-center font-semibold">No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-red-700"
                disabled={cancelando}
                onPress={() => void confirmarCancelarEntreno()}
              >
                {cancelando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-bold">Sí, cancelar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
