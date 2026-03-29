import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import SimpleLineChart from "@/components/charts/SimpleLineChart";
import { RootStackParamList } from "@/navigation/types";
import { getEjercicioById } from "@/services/ejercicios/ejerciciosService";
import {
  getHistorialPorEjercicio,
  HistorialEjercicioFila,
} from "@/services/entrenamientos/entrenamientosService";
import {
  etiquetaMetrica,
  MetricaEvolucion,
  puntosEvolucionPorSesion,
  type PuntoEvolucionEjercicio,
  valorMetrica,
} from "@/lib/evolucionEjercicio";

type Props = NativeStackScreenProps<RootStackParamList, "ExerciseDetail">;

type BloqueEntreno = {
  entrenamientoId: number;
  fecha: string;
  rutinaNombre: string;
  diaNombre: string | null;
  series: HistorialEjercicioFila[];
};

function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function agruparPorEntreno(rows: HistorialEjercicioFila[]): BloqueEntreno[] {
  const orden: number[] = [];
  const map = new Map<number, HistorialEjercicioFila[]>();

  for (const r of rows) {
    if (!map.has(r.entrenamientoId)) {
      map.set(r.entrenamientoId, []);
      orden.push(r.entrenamientoId);
    }
    map.get(r.entrenamientoId)!.push(r);
  }

  return orden.map((entrenamientoId) => {
    const series = map.get(entrenamientoId)!;
    const head = series[0];
    return {
      entrenamientoId,
      fecha: head.fecha,
      rutinaNombre: head.rutinaNombre,
      diaNombre: head.diaNombre,
      series,
    };
  });
}

const TABS = [
  { id: "historial" as const, label: "Historial" },
  { id: "evolucion" as const, label: "Evolución" },
];

function formatMetricaValor(m: MetricaEvolucion, v: number): string {
  if (m === "volumen") return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
  return v.toFixed(1);
}

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const { ejercicioId } = route.params;
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialEjercicioFila[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("historial");
  const [metrica, setMetrica] = useState<MetricaEvolucion>("maxPeso");
  const [puntoModal, setPuntoModal] = useState<PuntoEvolucionEjercicio | null>(null);

  const bloques = useMemo(() => agruparPorEntreno(historial), [historial]);
  const puntosEvo = useMemo(() => puntosEvolucionPorSesion(historial), [historial]);
  const valoresGrafica = useMemo(
    () => puntosEvo.map((p) => valorMetrica(p, metrica)),
    [puntosEvo, metrica]
  );
  const etiquetasGrafica = useMemo(
    () =>
      puntosEvo.map((p) => {
        const [, m, d] = p.fecha.split("-");
        return m && d ? `${d}/${m}` : p.fecha;
      }),
    [puntosEvo]
  );

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [ej, hist] = await Promise.all([
        getEjercicioById(ejercicioId),
        getHistorialPorEjercicio(ejercicioId),
      ]);
      if (ej) {
        setNombre(ej.nombre);
        setCategoria(ej.categoria_nombre ?? null);
      }
      setHistorial(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ejercicioId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const metricas: MetricaEvolucion[] = ["maxPeso", "volumen", "repsMejorSerie"];

  const seriesDeSesion = useMemo(() => {
    if (!puntoModal) return [] as HistorialEjercicioFila[];
    return historial
      .filter((r) => r.entrenamientoId === puntoModal.entrenamientoId)
      .sort((a, b) => a.serieOrden - b.serieOrden);
  }, [historial, puntoModal]);

  const cabeceraSesionModal = useMemo(() => {
    const head = seriesDeSesion[0];
    if (!head) return { rutinaNombre: "—", diaNombre: null as string | null };
    return { rutinaNombre: head.rutinaNombre, diaNombre: head.diaNombre };
  }, [seriesDeSesion]);

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <View className="flex-1">
          <View className="px-4 pt-2 pb-3 border-b border-slate-800">
            <Text className="text-white text-2xl font-bold">{nombre || "Ejercicio"}</Text>
            <Text className="text-slate-400 mt-1">{categoria ?? "Sin categoría"}</Text>
            <Text className="text-slate-600 text-[10px] font-bold uppercase mt-3 mb-2">Vista</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTab(t.id)}
                    className={`px-5 py-2.5 rounded-xl border ${
                      active ? "bg-blue-600 border-blue-500" : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    <Text className={`text-sm font-bold ${active ? "text-white" : "text-slate-300"}`}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {tab === "historial" ? (
            <FlatList
              className="flex-1"
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              data={bloques}
              keyExtractor={(item) => item.entrenamientoId.toString()}
              ListEmptyComponent={
                <Text className="text-slate-500 text-center mt-6">
                  Aún no has registrado series para este ejercicio.
                </Text>
              }
              ListHeaderComponent={
                <Text className="text-slate-600 text-xs leading-5 mb-4">
                  Cada bloque es una sesión finalizada. Las series están agrupadas por entreno.
                </Text>
              }
              renderItem={({ item }) => (
                <View className="bg-slate-800/95 rounded-2xl mb-4 border border-slate-700 overflow-hidden">
                  <View className="px-4 py-3 border-b border-slate-700 bg-slate-800">
                    <Text className="text-slate-500 text-xs">{item.fecha}</Text>
                    <Text className="text-white text-base font-bold capitalize mt-0.5">{fechaLegible(item.fecha)}</Text>
                    <Text className="text-emerald-400 font-semibold text-sm mt-2">{item.rutinaNombre}</Text>
                    <Text className="text-slate-400 text-sm">{item.diaNombre ?? ""}</Text>
                  </View>
                  <View className="p-3 gap-2">
                    {item.series.map((s) => (
                      <View
                        key={s.id}
                        className="bg-slate-900/70 px-3 py-2.5 rounded-xl border border-slate-700/80 flex-row justify-between items-center"
                      >
                        <Text className="text-slate-400 text-sm">Serie {s.serieOrden}</Text>
                        <Text className="text-slate-100 font-mono text-sm">
                          {s.reps} reps @ {s.peso} kg
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            />
          ) : (
            <ScrollView
              className="flex-1 px-4 pt-4"
              contentContainerStyle={{ paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-slate-400 text-sm leading-5 mb-4">
                En fuerza suele compararse el progreso por sesión usando una sola cifra: el peso máximo movido, el volumen
                total (suma de reps × kg) o las reps de la serie más pesada. Elige la métrica y lee la tendencia en el
                tiempo (eje horizontal = orden cronológico de entrenos).
              </Text>
              <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Métrica</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {metricas.map((m) => {
                  const active = metrica === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMetrica(m)}
                      className={`px-3 py-2 rounded-xl border ${
                        active ? "bg-emerald-900/50 border-emerald-600" : "bg-slate-800 border-slate-700"
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${active ? "text-emerald-200" : "text-slate-400"}`}>
                        {etiquetaMetrica(m)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 mb-4">
                <SimpleLineChart
                  values={valoresGrafica}
                  labels={etiquetasGrafica}
                  yAxisLabel={etiquetaMetrica(metrica)}
                  strokeColor="#34d399"
                  onPointPress={(index) => {
                    const p = puntosEvo[index];
                    if (p) setPuntoModal(p);
                  }}
                />
              </View>
              {puntosEvo.length > 0 ? (
                <>
                  <Text className="text-slate-600 text-xs mb-3">
                    {puntosEvo.length} sesión{puntosEvo.length === 1 ? "" : "es"} en el historial. Toca un punto en la
                    gráfica o una fila de la tabla.
                  </Text>
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Tabla por sesión</Text>
                  <View className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden mb-2">
                    <View className="flex-row border-b border-slate-700 bg-slate-800 px-3 py-2">
                      <Text className="text-slate-500 text-[10px] font-bold uppercase flex-1">Fecha</Text>
                      <Text className="text-slate-500 text-[10px] font-bold uppercase w-24 text-right">
                        {etiquetaMetrica(metrica)}
                      </Text>
                    </View>
                    {puntosEvo.map((p) => (
                      <Pressable
                        key={p.entrenamientoId}
                        onPress={() => setPuntoModal(p)}
                        className="flex-row items-center px-3 py-3 border-b border-slate-700/80 active:bg-slate-700/40"
                      >
                        <View className="flex-1 pr-2">
                          <Text className="text-slate-200 text-sm font-medium">{p.fecha}</Text>
                          <Text className="text-slate-500 text-xs capitalize mt-0.5">{fechaLegible(p.fecha)}</Text>
                        </View>
                        <Text className="text-emerald-400 font-mono text-sm w-24 text-right">
                          {formatMetricaValor(metrica, valorMetrica(p, metrica))}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>
          )}
        </View>
      )}

      <Modal visible={puntoModal != null} transparent animationType="fade" onRequestClose={() => setPuntoModal(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          <Pressable className="flex-1" onPress={() => setPuntoModal(null)} />
          <View className="bg-slate-800 rounded-t-3xl border border-slate-600 border-b-0 max-h-[88%]">
            <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-2" />
            {puntoModal ? (
              <ScrollView className="px-5 pb-8 pt-2" keyboardShouldPersistTaps="handled">
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Sesión</Text>
                <Text className="text-white text-xl font-bold capitalize">{fechaLegible(puntoModal.fecha)}</Text>
                <Text className="text-slate-500 text-sm mb-1">{puntoModal.fecha}</Text>
                <Text className="text-emerald-400 font-semibold text-sm mt-2">{cabeceraSesionModal.rutinaNombre}</Text>
                <Text className="text-slate-400 text-sm mb-4">{cabeceraSesionModal.diaNombre ?? ""}</Text>

                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Resumen (esta métrica)</Text>
                <View className="bg-slate-900/80 rounded-xl p-3 border border-slate-700 mb-4">
                  <Text className="text-slate-300 text-sm">
                    <Text className="text-slate-500">{etiquetaMetrica(metrica)}: </Text>
                    <Text className="text-emerald-300 font-semibold">
                      {formatMetricaValor(metrica, valorMetrica(puntoModal, metrica))}
                    </Text>
                  </Text>
                </View>

                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Todas las series en este entreno</Text>
                <Text className="text-slate-600 text-xs mb-2">Peso y repeticiones registradas para este ejercicio.</Text>
                {seriesDeSesion.length === 0 ? (
                  <Text className="text-slate-500 text-sm mb-4">No hay series en caché para esta sesión.</Text>
                ) : (
                  <View className="gap-2 mb-5">
                    {seriesDeSesion.map((s) => (
                      <View
                        key={s.id}
                        className="bg-slate-900/80 px-3 py-2.5 rounded-xl border border-slate-700 flex-row justify-between items-center"
                      >
                        <Text className="text-slate-400 text-sm">Serie {s.serieOrden}</Text>
                        <Text className="text-slate-100 font-mono text-sm">
                          {s.reps} reps × {s.peso} kg
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Otras métricas de la sesión</Text>
                <View className="bg-slate-900/60 rounded-xl p-3 border border-slate-700 mb-5 gap-1">
                  <Text className="text-slate-400 text-sm">
                    Peso máx.: <Text className="text-white font-mono">{puntoModal.maxPeso.toFixed(1)} kg</Text>
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    Volumen total: <Text className="text-white font-mono">{puntoModal.volumenTotal.toFixed(0)}</Text>
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    Reps (serie más pesada):{" "}
                    <Text className="text-white font-mono">{puntoModal.repsEnSerieMasPesada}</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  className="py-3.5 rounded-xl bg-blue-600 mb-3"
                  onPress={() => {
                    const id = puntoModal.entrenamientoId;
                    setPuntoModal(null);
                    navigation.navigate("SessionDetail", { entrenamientoId: id });
                  }}
                  activeOpacity={0.85}
                >
                  <Text className="text-white text-center font-bold">Ver detalle entreno</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-3 rounded-xl bg-slate-700"
                  onPress={() => setPuntoModal(null)}
                  activeOpacity={0.85}
                >
                  <Text className="text-slate-200 text-center font-semibold">Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
