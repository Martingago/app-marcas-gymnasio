import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import {
  getHistorialSesionesPorRutina,
  SesionRutinaResumen,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "RoutineHistory">;

export default function RoutineHistoryScreen({ navigation, route }: Props) {
  const { rutinaId, nombreRutina } = route.params;
  const [loading, setLoading] = useState(true);
  const [sesiones, setSesiones] = useState<SesionRutinaResumen[]>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistorialSesionesPorRutina(rutinaId);
      setSesiones(data);
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
      <Text className="text-slate-400 mb-6">Historial de entrenos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
      ) : sesiones.length === 0 ? (
        <Text className="text-slate-500 text-center mt-10">Aún no hay entrenos registrados con esta rutina.</Text>
      ) : (
        <FlatList
          data={sesiones}
          keyExtractor={(item) => item.entrenamientoId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-slate-800 p-4 rounded-xl mb-3 border border-slate-700"
              onPress={() =>
                navigation.navigate("SessionDetail", { entrenamientoId: item.entrenamientoId })
              }
            >
              <Text className="text-white font-bold text-lg">{item.fecha}</Text>
              <Text className="text-slate-400 mt-1">{item.diaNombre ?? "Día"}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
