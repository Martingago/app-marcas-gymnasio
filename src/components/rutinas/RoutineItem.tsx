import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  rutina: { id: number; nombre: string; totalDias: number };
  /** Hay un entreno sin finalizar en esta rutina (sesión abierta). */
  entrenoEnCurso?: boolean;
  onOptionsPress: (rutina: Props["rutina"]) => void;
  onDuplicatePress?: (rutina: Props["rutina"]) => void;
  /** Navega a la vista de días (modo información desde Mis rutinas). */
  onRoutineDetails?: (rutina: Props["rutina"]) => void;
  onStartWorkout?: (rutina: Props["rutina"]) => void;
  onRoutineHistory?: (rutina: Props["rutina"]) => void;
}

export default function RoutineItem({
  rutina,
  entrenoEnCurso = false,
  onOptionsPress,
  onDuplicatePress,
  onRoutineDetails,
  onStartWorkout,
  onRoutineHistory,
}: Props) {
  return (
    <View className="relative bg-slate-800 rounded-xl mb-4 border border-slate-700 overflow-hidden">
      {entrenoEnCurso ? (
        <View
          className="absolute top-1 right-1 z-10 px-2 py-0.5 rounded-xl bg-emerald-950/95 border border-emerald-500/50"
          pointerEvents="none"
        >
          <Text className="text-emerald-300 text-[9px] font-bold uppercase leading-tight" numberOfLines={1}>
            entreno en curso
          </Text>
        </View>
      ) : null}

      <View className="p-4 flex-row items-start justify-between gap-2">
        {onDuplicatePress ? (
          <TouchableOpacity
            className="mt-0.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-600/90"
            onPress={() => onDuplicatePress(rutina)}
            accessibilityLabel="Duplicar rutina"
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            activeOpacity={0.85}
          >
            <Ionicons name="copy-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}

        <View
          className={`flex-1 min-w-0 pt-0.5 ${entrenoEnCurso ? "pr-24" : "pr-1"}`}
        >
          <Text className="text-white text-lg font-bold" numberOfLines={2}>
            {rutina.nombre}
          </Text>
          <Text className="text-slate-500 text-sm mt-1">
            {rutina.totalDias === 1 ? "1 día de entrenamiento" : `${rutina.totalDias} días de entrenamiento`}
          </Text>
        </View>

        <TouchableOpacity
          className="mt-3 p-2"
          onPress={() => onOptionsPress(rutina)}
          accessibilityLabel="Opciones de rutina"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {onRoutineDetails ? (
        <View className="px-4 pb-3">
          <TouchableOpacity
            className="py-3 rounded-xl items-center border border-slate-600 bg-slate-900/50"
            onPress={() => onRoutineDetails(rutina)}
            activeOpacity={0.85}
            accessibilityLabel="Ver detalles de la rutina"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="list-outline" size={20} color="#cbd5e1" />
              <Text className="text-slate-200 font-semibold">Ver detalles de la rutina</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row px-4 pb-4 pt-1 gap-2">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl items-center border ${
            entrenoEnCurso ? "bg-emerald-600 border-emerald-500/45" : "bg-blue-600 border-blue-500/40"
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
    </View>
  );
}
