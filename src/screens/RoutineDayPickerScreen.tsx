import React, { useCallback, useLayoutEffect, useState } from "react";
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
import {
  getEntrenoActivoRutina,
  getProximoDiaSugerido,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "RoutineDayPicker">;

export default function RoutineDayPickerScreen({ navigation, route }: Props) {
  const { rutinaId, nombreRutina, vistaInformacionRutina } = route.params;
  const esVistaInformacion = vistaInformacionRutina === true;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: esVistaInformacion ? "Información de la rutina" : "Elegir día",
    });
  }, [navigation, esVistaInformacion]);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState<{ id: number; nombre: string; orden: number }[]>([]);
  const [sugeridoId, setSugeridoId] = useState<number | null>(null);
  const [entrenoActivo, setEntrenoActivo] = useState<Awaited<
    ReturnType<typeof getEntrenoActivoRutina>
  > | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, sug, activo] = await Promise.all([
        getDiasPorRutina(rutinaId),
        getProximoDiaSugerido(rutinaId),
        getEntrenoActivoRutina(rutinaId),
      ]);
      setDias(lista);
      setSugeridoId(sug?.id ?? null);
      setEntrenoActivo(activo);
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
      {esVistaInformacion ? (
        <Text className="text-white text-2xl font-bold mb-4">{nombreRutina}</Text>
      ) : (
        <>
          <Text className="text-white text-2xl font-bold mb-1">{nombreRutina}</Text>
          <Text className="text-slate-400 mb-4">Elige el día que vas a entrenar</Text>
        </>
      )}

      {entrenoActivo ? (
        <View className="bg-amber-900/35 border border-amber-600/45 rounded-xl p-3 mb-4">
          <Text className="text-amber-200 font-bold text-sm mb-1">Entreno en curso</Text>
          <Text className="text-amber-100/90 text-sm leading-5">
            Tienes un día sin finalizar: «{entrenoActivo.nombreDia ?? "—"}». Solo puedes seguir editando ese día hasta
            pulsar &quot;Finalizar día&quot;. El resto queda bloqueado hasta entonces.
          </Text>
        </View>
      ) : null}

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
            const esEnCurso = entrenoActivo?.rutinaDiaId === item.id;
            const esSugerido = sugeridoId === item.id;
            const destacarRecomendado = esSugerido && entrenoActivo == null;
            return (
              <TouchableOpacity
                className={`p-4 rounded-2xl mb-3 border ${
                  esEnCurso
                    ? "bg-blue-900/40 border-blue-500/50"
                    : destacarRecomendado
                      ? "bg-emerald-900/40 border-emerald-500/50"
                      : "bg-slate-800 border-slate-700"
                }`}
                onPress={() => {
                  if (esEnCurso) {
                    navigation.navigate("WorkoutSession", {
                      rutinaId,
                      rutinaDiaId: item.id,
                      nombreRutina,
                      nombreDia: item.nombre,
                    });
                  } else {
                    navigation.navigate("RoutineDayPreview", {
                      rutinaId,
                      rutinaDiaId: item.id,
                      nombreRutina,
                      nombreDia: item.nombre,
                    });
                  }
                }}
              >
                <View className="flex-row justify-between items-center flex-wrap gap-2">
                  <Text className="text-white text-lg font-bold flex-shrink">{item.nombre}</Text>
                  <View className="flex-row gap-2">
                    {esEnCurso ? (
                      <Text className="text-blue-300 text-xs font-bold uppercase">En curso</Text>
                    ) : null}
                    {destacarRecomendado ? (
                      <Text className="text-emerald-400 text-xs font-bold uppercase">Recomendado</Text>
                    ) : null}
                  </View>
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
