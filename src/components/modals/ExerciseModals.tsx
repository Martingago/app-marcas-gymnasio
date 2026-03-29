import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ejercicio } from "@/interfaces/ejercicio";
import { Categoria } from "@/interfaces/categoria";

const inputBaseStyle = {
  backgroundColor: "#1e293b",
  color: "#f8fafc",
  borderWidth: 1,
  borderColor: "#475569",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
} as const;

type OptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  nombreEjercicio?: string | null;
};

export function OptionsModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  nombreEjercicio,
}: OptionsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" />
        <View className="bg-slate-800 rounded-t-3xl border border-slate-600 border-b-0 px-4 pb-8 pt-2">
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mb-4" />
          {nombreEjercicio ? (
            <Text className="text-white text-base font-bold text-center mb-1" numberOfLines={2}>
              {nombreEjercicio}
            </Text>
          ) : null}
          <Text className="text-slate-500 text-xs text-center mb-4">Elige una acción</Text>
          <TouchableOpacity
            className="bg-slate-700 py-3.5 rounded-xl mb-2 border border-slate-600"
            onPress={onEdit}
            activeOpacity={0.85}
          >
            <Text className="text-white text-center font-semibold text-base">Editar ejercicio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-3.5 rounded-xl border border-red-800/60 bg-red-950/40"
            onPress={onDelete}
            activeOpacity={0.85}
          >
            <Text className="text-red-400 text-center font-semibold text-base">Eliminar ejercicio</Text>
          </TouchableOpacity>
          <TouchableOpacity className="mt-4 py-3" onPress={onClose} activeOpacity={0.85}>
            <Text className="text-slate-400 text-center font-semibold">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type DeleteModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  ejercicio: Ejercicio | null;
};

export function DeleteModal({ visible, onClose, onConfirm, ejercicio }: DeleteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center px-6">
        <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
          <Text className="text-white text-xl font-bold mb-2 text-center">¿Eliminar ejercicio?</Text>
          <Text className="text-slate-400 text-sm text-center leading-5 mb-6">
            Se borrará «{ejercicio?.nombre ?? "…"}» de tu lista. Los registros históricos de entrenos no se eliminan.
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

type FormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { id?: number; nombre: string; categoria_id: number | null }) => void;
  categorias: Categoria[];
  ejercicioAEditar: Ejercicio | null;
};

export function FormModal({ visible, onClose, onSave, categorias, ejercicioAEditar }: FormModalProps) {
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setNombre(ejercicioAEditar?.nombre ?? "");
      setCategoriaId(ejercicioAEditar?.categoria_id ?? null);
    }
  }, [visible, ejercicioAEditar]);

  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave({ id: ejercicioAEditar?.id, nombre: nombre.trim(), categoria_id: categoriaId });
    onClose();
  };

  const titulo = ejercicioAEditar ? "Editar ejercicio" : "Nuevo ejercicio";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/70 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" />
        <View className="bg-slate-800 rounded-t-3xl border border-slate-600 border-b-0 max-h-[88%]">
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-2" />
          <ScrollView
            className="px-5 pt-2"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            <Text className="text-white text-xl font-bold mb-1">{titulo}</Text>
            <Text className="text-slate-500 text-sm mb-5">
              {ejercicioAEditar ? "Actualiza nombre o categoría." : "Añade un ejercicio a tu catálogo."}
            </Text>

            <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Nombre</Text>
            <View className="mb-5">
            <TextInput
              style={inputBaseStyle}
              placeholder="Ej. Press banca, Sentadilla…"
              placeholderTextColor="#94a3b8"
              value={nombre}
              onChangeText={setNombre}
              underlineColorAndroid="transparent"
            />
            </View>

            <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Categoría (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ gap: 8 }}>
              {categorias.map((cat) => {
                const active = categoriaId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    className={`px-4 py-3 rounded-xl border ${
                      active ? "bg-blue-600 border-blue-500" : "bg-slate-900/80 border-slate-700"
                    }`}
                    onPress={() => setCategoriaId(active ? null : cat.id)}
                    activeOpacity={0.85}
                  >
                    <Text className={active ? "text-white font-semibold" : "text-slate-300"}>{cat.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity className="flex-1 py-3.5 rounded-xl bg-slate-700" onPress={onClose} activeOpacity={0.85}>
                <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-xl ${!nombre.trim() ? "bg-emerald-900/40" : "bg-emerald-600"}`}
                onPress={handleSave}
                disabled={!nombre.trim()}
                activeOpacity={0.85}
              >
                <Text className="text-white text-center font-bold">Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
