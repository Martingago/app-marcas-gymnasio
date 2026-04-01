import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getRutinaCompleta } from "@/services/rutina/rutinasService";

type SerieDetalle = { orden: number; reps: string; peso: string };

type EjercicioDetalle = {
  rutinaDiaEjercicioId: number;
  ordenEjercicio: number;
  nombre: string;
  series: SerieDetalle[];
};

type DiaDetalle = {
  diaId: number;
  ordenDia: number;
  nombre: string;
  ejercicios: EjercicioDetalle[];
};

function buildDiasDetalle(
  rows: Awaited<ReturnType<typeof getRutinaCompleta>>
): DiaDetalle[] {
  const ordenDiaIds: number[] = [];
  const porDia = new Map<number, DiaDetalle>();
  const ejPorDia = new Map<number, Map<number, EjercicioDetalle>>();

  for (const row of rows) {
    if (!porDia.has(row.diaId)) {
      porDia.set(row.diaId, {
        diaId: row.diaId,
        ordenDia: row.ordenDia,
        nombre: row.diaNombre,
        ejercicios: [],
      });
      ordenDiaIds.push(row.diaId);
      ejPorDia.set(row.diaId, new Map());
    }

    if (row.rutinaDiaEjercicioId == null) continue;

    const ejMap = ejPorDia.get(row.diaId)!;
    if (!ejMap.has(row.rutinaDiaEjercicioId)) {
      const ej: EjercicioDetalle = {
        rutinaDiaEjercicioId: row.rutinaDiaEjercicioId,
        ordenEjercicio: row.ordenEjercicioEnDia ?? 0,
        nombre: row.ejercicioNombre ?? "—",
        series: [],
      };
      ejMap.set(row.rutinaDiaEjercicioId, ej);
    }

    const ej = ejMap.get(row.rutinaDiaEjercicioId)!;
    if (row.serieOrden != null) {
      ej.series.push({
        orden: row.serieOrden,
        reps: String(row.repsObjetivo ?? "—"),
        peso: String(row.pesoObjetivo ?? "0"),
      });
    }
  }

  for (const id of ordenDiaIds) {
    const dia = porDia.get(id)!;
    const ejMap = ejPorDia.get(id)!;
    dia.ejercicios = [...ejMap.values()].sort((a, b) => a.ordenEjercicio - b.ordenEjercicio);
    for (const ej of dia.ejercicios) {
      ej.series.sort((a, b) => a.orden - b.orden);
    }
  }

  return ordenDiaIds.map((id) => porDia.get(id)!);
}

interface Props {
  rutina: { id: number; nombre: string; totalDias: number };
  /** Hay un entreno sin finalizar en esta rutina (sesión abierta). */
  entrenoEnCurso?: boolean;
  onOptionsPress: (rutina: Props["rutina"]) => void;
  onStartWorkout?: (rutina: Props["rutina"]) => void;
  onRoutineHistory?: (rutina: Props["rutina"]) => void;
}

export default function RoutineItem({
  rutina,
  entrenoEnCurso = false,
  onOptionsPress,
  onStartWorkout,
  onRoutineHistory,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diasDetalle, setDiasDetalle] = useState<DiaDetalle[] | null>(null);
  /** Solo `true` = series visibles; por defecto cerrado por ejercicio. Clave: diaId-rutinaDiaEjercicioId */
  const [expandedEjercicioSeries, setExpandedEjercicioSeries] = useState<Record<string, boolean>>({});

  const toggleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (!diasDetalle) {
      setLoading(true);
      try {
        const detalles = await getRutinaCompleta(rutina.id);
        setDiasDetalle(buildDiasDetalle(detalles));
      } catch (error) {
        console.error("Error al cargar detalles de la rutina:", error);
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded(true);
  }, [isExpanded, diasDetalle, rutina.id]);

  return (
    <View className="bg-slate-800 rounded-2xl mb-4 border border-slate-700 overflow-hidden">
      <View className="p-4 flex-row justify-between items-center border-b border-slate-700/80">
        <Pressable className="flex-1 flex-row items-center pr-2" onPress={() => void toggleExpand()} accessibilityRole="button">
          <View className="flex-1 min-w-0">
            <Text className="text-white text-lg font-bold" numberOfLines={2}>
              {rutina.nombre}
            </Text>
            <Text className="text-slate-500 text-sm mt-1">
              {rutina.totalDias === 1 ? "1 día de entrenamiento" : `${rutina.totalDias} días de entrenamiento`}
            </Text>
            {entrenoEnCurso ? (
              <View className="self-start mt-2 px-2 py-1 rounded-md bg-blue-950/80 border border-blue-500/45">
                <Text className="text-blue-300 text-[10px] font-semibold">entreno en curso</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color="#64748b" />
        </Pressable>

        <View className="w-px h-10 bg-slate-700 mx-2" />

        <TouchableOpacity
          className="p-2"
          onPress={() => onOptionsPress(rutina)}
          accessibilityLabel="Opciones de rutina"
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View className="flex-row px-4 pb-4 pt-3 gap-2">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl items-center border ${
            entrenoEnCurso
              ? "bg-emerald-600 border-emerald-500/45"
              : "bg-blue-600 border-blue-500/40"
          }`}
          onPress={() => onStartWorkout?.(rutina)}
          activeOpacity={0.85}
          accessibilityLabel={entrenoEnCurso ? "Ir al entreno en curso" : "Entrenar"}
        >
          <Text className="text-white font-bold">{entrenoEnCurso ? "Ir al entreno" : "Entrenar"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-slate-700 py-3 rounded-xl items-center border border-slate-600"
          onPress={() => onRoutineHistory?.(rutina)}
          activeOpacity={0.85}
        >
          <Text className="text-slate-200 font-bold">Historial</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View className="px-4 pb-4 pt-1 border-t border-slate-700 bg-slate-900/40">
          {loading ? (
            <ActivityIndicator size="small" color="#3b82f6" className="my-4" />
          ) : diasDetalle && diasDetalle.length > 0 ? (
            diasDetalle.map((dia) => (
              <View key={dia.diaId} className="mb-3 rounded-xl border border-slate-700 bg-slate-800/90 overflow-hidden">
                <View className="flex-row items-center gap-2 px-3 py-2.5 bg-slate-900/80 border-b border-slate-700">
                  <View className="bg-blue-600/90 px-2 py-1 rounded-lg border border-blue-500/50">
                    <Text className="text-white text-xs font-bold tabular-nums">Día {dia.ordenDia}</Text>
                  </View>
                  <Text className="text-white font-semibold flex-1" numberOfLines={2}>
                    {dia.nombre}
                  </Text>
                </View>
                <View className="p-3 gap-2">
                  {dia.ejercicios.length === 0 ? (
                    <Text className="text-slate-500 text-sm italic">Sin ejercicios en este día.</Text>
                  ) : (
                    dia.ejercicios.map((ej) => {
                      const ejKey = `${dia.diaId}-${ej.rutinaDiaEjercicioId}`;
                      const seriesAbiertas = expandedEjercicioSeries[ejKey] === true;
                      const nSer = ej.series.length;
                      return (
                        <View
                          key={ej.rutinaDiaEjercicioId}
                          className="rounded-lg border border-slate-700/90 bg-slate-900/80 overflow-hidden"
                        >
                          <Pressable
                            onPress={() =>
                              setExpandedEjercicioSeries((m) => ({
                                ...m,
                                [ejKey]: !m[ejKey],
                              }))
                            }
                            className="p-3 flex-row items-start justify-between gap-2 active:opacity-90"
                          >
                            <View className="flex-1 min-w-0 pr-1">
                              <View className="flex-row items-baseline gap-2">
                                <Text className="text-slate-500 text-xs font-bold tabular-nums">
                                  #{ej.ordenEjercicio}
                                </Text>
                                <Text className="text-slate-100 font-semibold text-sm flex-1">{ej.nombre}</Text>
                              </View>
                              {!seriesAbiertas ? (
                                <Text className="text-slate-500 text-xs mt-1.5">
                                  {nSer === 0 ? "Sin series" : `${nSer} ${nSer === 1 ? "serie" : "series"}`}
                                </Text>
                              ) : null}
                            </View>
                            <Ionicons
                              name={seriesAbiertas ? "chevron-up" : "chevron-down"}
                              size={20}
                              color="#64748b"
                              style={{ marginTop: 2 }}
                            />
                          </Pressable>
                          {seriesAbiertas ? (
                            <View className="px-3 pb-3 flex-row flex-wrap -mx-1">
                              {ej.series.map((serie) => (
                                <View
                                  key={`${ej.rutinaDiaEjercicioId}-${serie.orden}`}
                                  className="w-1/2 px-1 mb-2"
                                >
                                  <View className="bg-slate-800 px-2 py-2 rounded-lg border border-slate-600 w-full min-h-[44px] justify-center">
                                    <Text className="text-slate-500 font-bold text-xs text-center">S{serie.orden}</Text>
                                    <Text className="text-slate-300 text-xs text-center mt-0.5" numberOfLines={2}>
                                      {serie.reps} reps ·{" "}
                                      <Text className="text-emerald-400/90">{serie.peso} kg</Text>
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text className="text-slate-500 text-sm text-center py-3">No hay datos de esta rutina.</Text>
          )}
        </View>
      )}
    </View>
  );
}
