import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import HistorialEntrenosVista from "@/components/historial/HistorialEntrenosVista";
import { RootStackParamList } from "@/navigation/types";
import {
  getHistorialSesionesTodos,
  type SesionRutinaResumen,
} from "@/services/entrenamientos/entrenamientosService";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

export default function HistoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [sesiones, setSesiones] = useState<SesionRutinaResumen[]>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistorialSesionesTodos();
      setSesiones(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <View className="flex-1">
        <HistorialEntrenosVista
          tituloPrincipal="Historial y evolución"
          subtitulo="Todos tus entrenos (cualquier rutina)"
          sesiones={sesiones}
          loading={loading}
          vacioMensaje="Aún no hay entrenos finalizados registrados."
          mostrarRutinaEnLista
          descripcionProgreso="Entrenos completados por semana (lunes a domingo), sumando todas las rutinas. Sirve para ver constancia global."
          vistaGlobalCalendario
          onNavigateToSession={(entrenamientoId) => navigation.navigate("SessionDetail", { entrenamientoId })}
          onRecargar={cargar}
        />
      </View>
    </SafeAreaView>
  );
}
