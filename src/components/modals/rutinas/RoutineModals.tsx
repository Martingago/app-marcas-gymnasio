import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";

interface OptionsProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  nombreRutina?: string | null;
}

export function RoutineOptionsModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  nombreRutina,
}: OptionsProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" />
        <View className="bg-slate-800 rounded-t-3xl border border-slate-600 border-b-0 px-4 pb-8 pt-2">
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mb-4" />
          {nombreRutina ? (
            <Text className="text-white text-base font-bold text-center mb-1" numberOfLines={2}>
              {nombreRutina}
            </Text>
          ) : null}
          <Text className="text-slate-500 text-xs text-center mb-4">Elige una acción</Text>
          <TouchableOpacity
            className="bg-slate-700 py-3.5 rounded-xl mb-2 border border-slate-600"
            onPress={onEdit}
            activeOpacity={0.85}
          >
            <Text className="text-white text-center font-semibold text-base">Editar rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-3.5 rounded-xl border border-red-800/60 bg-red-950/40"
            onPress={onDelete}
            activeOpacity={0.85}
          >
            <Text className="text-red-400 text-center font-semibold text-base">Eliminar rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity className="mt-4 py-3" onPress={onClose} activeOpacity={0.85}>
            <Text className="text-slate-400 text-center font-semibold">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface DeleteProps {
  visible: boolean;
  rutinaNombre?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function RoutineDeleteModal({ visible, rutinaNombre, onClose, onConfirm }: DeleteProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center px-6">
        <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
          <Text className="text-white text-xl font-bold mb-2 text-center">¿Eliminar rutina?</Text>
          <Text className="text-slate-400 text-sm text-center leading-5 mb-6">
            Se borrará «{rutinaNombre ?? "…"}» y sus días de entreno. Los entrenamientos ya registrados en el historial no se
            eliminan.
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 py-3 rounded-xl bg-slate-700" onPress={onClose} activeOpacity={0.85}>
              <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl bg-red-700"
              onPress={() => void onConfirm()}
              activeOpacity={0.85}
            >
              <Text className="text-white text-center font-bold">Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
