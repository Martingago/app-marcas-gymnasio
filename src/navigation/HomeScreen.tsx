import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "@/navigation/types";
import AppDialog, { AppDialogAction } from "@/components/ui/AppDialog";
import {
  exportAndShareBackup,
  importBackupPayload,
  parseBackupJson,
  pickAndReadBackupFile,
  validateBackupPayload,
  type NextPRBackupPayload,
} from "@/services/backup/backupService";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    actions: AppDialogAction[];
  } | null>(null);

  const closeDialog = useCallback(() => setDialog(null), []);

  const showDialog = useCallback((title: string, message: string, actions: AppDialogAction[]) => {
    setDialog({ title, message, actions });
  }, []);

  const runImport = useCallback(
    async (payload: NextPRBackupPayload) => {
      setBusy(true);
      closeDialog();
      try {
        await importBackupPayload(payload);
        showDialog(
          "Importación correcta",
          "Los datos se han sustituido por los del archivo. Cierra la app por completo y ábrela de nuevo para asegurarte de que todo se muestra bien.",
          [{ label: "Entendido", onPress: closeDialog }]
        );
      } catch (e) {
        showDialog(
          "Error al importar",
          e instanceof Error ? e.message : "No se pudieron aplicar los datos.",
          [{ label: "Entendido", onPress: closeDialog }]
        );
      } finally {
        setBusy(false);
      }
    },
    [closeDialog, showDialog]
  );

  const onExport = useCallback(async () => {
    if (Platform.OS === "web") {
      showDialog("No disponible", "La copia en archivo solo está disponible en la app móvil.", [
        { label: "Entendido", onPress: closeDialog },
      ]);
      return;
    }
    setMenuOpen(false);
    setBusy(true);
    try {
      await exportAndShareBackup();
      showDialog(
        "Copia creada",
        "Se ha generado el archivo JSON. Usa el menú del sistema para guardarlo donde quieras (Descargas, Drive, etc.).",
        [{ label: "Entendido", onPress: closeDialog }]
      );
    } catch (e) {
      showDialog(
        "Error al exportar",
        e instanceof Error ? e.message : "No se pudo crear la copia.",
        [{ label: "Entendido", onPress: closeDialog }]
      );
    } finally {
      setBusy(false);
    }
  }, [closeDialog, showDialog]);

  const onImportPick = useCallback(async () => {
    if (Platform.OS === "web") {
      showDialog("No disponible", "La importación solo está disponible en la app móvil.", [
        { label: "Entendido", onPress: closeDialog },
      ]);
      return;
    }
    setMenuOpen(false);
    setBusy(true);
    try {
      const text = await pickAndReadBackupFile();
      if (text == null) {
        setBusy(false);
        return;
      }
      let parsed: unknown;
      try {
        parsed = parseBackupJson(text);
      } catch (e) {
        showDialog(
          "Archivo inválido",
          e instanceof Error ? e.message : "No es un JSON válido.",
          [{ label: "Entendido", onPress: closeDialog }]
        );
        setBusy(false);
        return;
      }
      const v = validateBackupPayload(parsed);
      if (!v.ok) {
        showDialog("Copia no compatible", v.message, [{ label: "Entendido", onPress: closeDialog }]);
        setBusy(false);
        return;
      }
      setBusy(false);
      const payload = v.data;
      showDialog(
        "Sustituir todos los datos",
        "Se eliminarán rutinas, ejercicios, entrenos e historial de este dispositivo y se cargará solo lo que trae el archivo. ¿Continuar?",
        [
          { label: "Cancelar", onPress: closeDialog },
          {
            label: "Importar",
            variant: "destructive",
            onPress: () => void runImport(payload),
          },
        ]
      );
    } catch (e) {
      showDialog(
        "Error",
        e instanceof Error ? e.message : "No se pudo leer el archivo.",
        [{ label: "Entendido", onPress: closeDialog }]
      );
      setBusy(false);
    }
  }, [closeDialog, runImport, showDialog]);

  const menuTop = insets.top + 52;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-slate-900">
      <View className="px-4 pt-1 pb-2 flex-row justify-end items-center min-h-[44px]">
        <Pressable
          onPress={() => setMenuOpen(true)}
          className="p-2 rounded-xl active:bg-slate-800"
          accessibilityLabel="Copia de seguridad"
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={26} color="#94a3b8" />
        </Pressable>
      </View>

      <View className="flex-1 px-6 justify-center">
        <Text className="text-white text-6xl font-bold mb-2 text-center">NextPR</Text>
        <Text className="text-slate-500 text-center text-sm mb-10">Rutinas, entrenos y seguimiento</Text>

        <View className="gap-5">
          <TouchableOpacity
            className="bg-blue-600 py-5 px-6 rounded-2xl shadow-lg"
            onPress={() => navigation.navigate("Routines")}
            activeOpacity={0.85}
            disabled={busy}
          >
            <Text className="text-white text-xl font-semibold text-center">Empezar entreno</Text>
            <Text className="text-blue-100/90 text-sm text-center mt-1">Elegir rutina y día</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-800 py-5 px-6 rounded-2xl border border-slate-700"
            onPress={() => navigation.navigate("Exercises")}
            activeOpacity={0.85}
            disabled={busy}
          >
            <Text className="text-slate-200 text-lg font-semibold text-center">Mis ejercicios</Text>
            <Text className="text-slate-500 text-sm text-center mt-1">Catálogo y detalle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-800 py-5 px-6 rounded-2xl border border-slate-700"
            onPress={() => navigation.navigate("History")}
            activeOpacity={0.85}
            disabled={busy}
          >
            <Text className="text-slate-200 text-lg font-semibold text-center">Historial y evolución</Text>
            <Text className="text-slate-500 text-sm text-center mt-1">Lista, calendario y progreso global</Text>
          </TouchableOpacity>
        </View>
      </View>

      {busy ? (
        <View className="absolute inset-0 bg-slate-900/70 justify-center items-center" pointerEvents="auto">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-300 mt-3 text-sm">Procesando…</Text>
        </View>
      ) : null}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View className="flex-1">
          <Pressable className="flex-1 bg-black/50" onPress={() => setMenuOpen(false)} />
          <View
            className="absolute right-4 w-56 rounded-2xl border border-slate-600 bg-slate-800 overflow-hidden shadow-xl"
            style={{ top: menuTop }}
          >
            <Text className="text-slate-500 text-[10px] font-bold uppercase px-4 pt-3 pb-1">Copia de seguridad</Text>
            <TouchableOpacity
              className="px-4 py-3.5 border-t border-slate-700 active:bg-slate-700/80"
              onPress={() => void onExport()}
              disabled={busy}
            >
              <Text className="text-white font-semibold">Exportar datos</Text>
              <Text className="text-slate-500 text-xs mt-0.5">JSON para guardar en el teléfono</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-3.5 border-t border-slate-700 active:bg-slate-700/80"
              onPress={() => void onImportPick()}
              disabled={busy}
            >
              <Text className="text-white font-semibold">Importar datos</Text>
              <Text className="text-slate-500 text-xs mt-0.5">Sustituye lo actual por el archivo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-3 border-t border-slate-600 bg-slate-900/50"
              onPress={() => setMenuOpen(false)}
            >
              <Text className="text-slate-400 text-center font-semibold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AppDialog
        visible={dialog != null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        onRequestClose={closeDialog}
        actions={dialog?.actions ?? []}
      />
    </SafeAreaView>
  );
}
