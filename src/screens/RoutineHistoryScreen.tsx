import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import HistorialEntrenosVista from "@/components/historial/HistorialEntrenosVista";
import { RootStackParamList } from "@/navigation/types";
import {
  getHistorialSesionesPorRutina,
  type SesionRutinaResumen,
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
      void cargar();
    }, [cargar])
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-slate-900">
      <View className="flex-1">
        <HistorialEntrenosVista
          tituloPrincipal={nombreRutina}
          subtitulo="Historial de entrenos"
          sesiones={sesiones}
          loading={loading}
          vacioMensaje="Aún no hay entrenos registrados con esta rutina."
          mostrarRutinaEnLista={false}
          descripcionProgreso="Entrenos completados por semana (lunes a domingo) con esta rutina. Sirve para ver constancia, no el peso de cada ejercicio (eso está en el detalle de cada ejercicio)."
          vistaGlobalCalendario={false}
          onNavigateToSession={(entrenamientoId) => navigation.navigate("SessionDetail", { entrenamientoId })}
          onRecargar={cargar}
        />
      </View>
    </SafeAreaView>
  );
}
