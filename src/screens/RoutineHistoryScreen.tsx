import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList } from "@/navigation/types";
import {
  eliminarEntrenamientoFinalizado,
  getHistorialSesionesPorRutina,
  SesionRutinaResumen,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "RoutineHistory">;

export default function RoutineHistoryScreen({ navigation, route }: Props) {
  const { rutinaId, nombreRutina } = route.params;
  const [loading, setLoading] = useState(true);
  const [sesiones, setSesiones] = useState<SesionRutinaResumen[]>([]);
  const [borrar, setBorrar] = useState<SesionRutinaResumen | null>(null);
  const [eliminando, setEliminando] = useState(false);

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

  const confirmarEliminar = async () => {
    if (!borrar) return;
    setEliminando(true);
    try {
      await eliminarEntrenamientoFinalizado(borrar.entrenamientoId);
      setBorrar(null);
      await cargar();
    } catch (e) {
      console.error(e);
    } finally {
      setEliminando(false);
    }
  };

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
            <View className="bg-slate-800 rounded-xl mb-3 border border-slate-700 flex-row overflow-hidden">
              <TouchableOpacity
                className="flex-1 p-4 pr-2"
                onPress={() => navigation.navigate("SessionDetail", { entrenamientoId: item.entrenamientoId })}
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-lg">{item.fecha}</Text>
                <Text className="text-slate-400 mt-1">{item.diaNombre ?? "Día"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 justify-center border-l border-slate-700 bg-slate-800/95"
                onPress={() => setBorrar(item)}
                activeOpacity={0.85}
              >
                <Text className="text-red-400 font-semibold text-sm">Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={borrar != null} transparent animationType="fade" onRequestClose={() => setBorrar(null)}>
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">¿Eliminar este día del historial?</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-2">
              Se borrará el registro del {borrar?.fecha}
              {borrar?.diaNombre ? ` (${borrar.diaNombre})` : ""} y todas las series guardadas. Esta acción no se puede
              deshacer.
            </Text>
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-slate-700"
                disabled={eliminando}
                onPress={() => setBorrar(null)}
              >
                <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-red-700"
                disabled={eliminando}
                onPress={() => void confirmarEliminar()}
              >
                {eliminando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-bold">Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
