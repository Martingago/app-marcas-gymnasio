import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import { getDiasPorRutina } from "@/services/rutina/rutinasService";
import { getProximoDiaSugerido } from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "RoutineDayPicker">;

export default function RoutineDayPickerScreen({ navigation, route }: Props) {
  const { rutinaId, nombreRutina } = route.params;
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState<{ id: number; nombre: string; orden: number }[]>([]);
  const [sugeridoId, setSugeridoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, sug] = await Promise.all([
        getDiasPorRutina(rutinaId),
        getProximoDiaSugerido(rutinaId),
      ]);
      setDias(lista);
      setSugeridoId(sug?.id ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [rutinaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900 p-4">
      <Text className="text-white text-2xl font-bold mb-1">{nombreRutina}</Text>
      <Text className="text-slate-400 mb-6">Elige el día que vas a entrenar</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
      ) : dias.length === 0 ? (
        <Text className="text-slate-500 text-center mt-10">
          Esta rutina no tiene días configurados. Edítala y añade ejercicios.
        </Text>
      ) : (
        <FlatList
          data={dias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const esSugerido = sugeridoId === item.id;
            return (
              <TouchableOpacity
                className={`p-4 rounded-2xl mb-3 border ${
                  esSugerido ? "bg-emerald-900/40 border-emerald-500/50" : "bg-slate-800 border-slate-700"
                }`}
                onPress={() =>
                  navigation.navigate("WorkoutSession", {
                    rutinaId,
                    rutinaDiaId: item.id,
                    nombreRutina,
                    nombreDia: item.nombre,
                  })
                }
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-lg font-bold">{item.nombre}</Text>
                  {esSugerido ? (
                    <Text className="text-emerald-400 text-xs font-bold uppercase">Siguiente</Text>
                  ) : null}
                </View>
                <Text className="text-slate-500 text-sm mt-1">Orden {item.orden}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        className="mt-4 py-3 border border-slate-600 rounded-xl"
        onPress={() => navigation.navigate("RoutineHistory", { rutinaId, nombreRutina })}
      >
        <Text className="text-slate-300 text-center font-semibold">Ver historial de esta rutina</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
