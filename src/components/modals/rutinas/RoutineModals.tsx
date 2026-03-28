// src\components\modals\rutinas\RoutineModalts.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

// --- MODAL DE OPCIONES ---
interface OptionsProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoutineOptionsModal({ visible, onClose, onEdit, onDelete }: OptionsProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        className="flex-1 justify-end bg-black/50" 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View className="bg-slate-800 p-6 rounded-t-3xl border-t border-slate-700">
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mb-6" />
          
          <TouchableOpacity className="py-4 border-b border-slate-700 flex-row items-center" onPress={onEdit}>
            <Text className="text-white text-lg font-bold">✏️ Editar Rutina</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="py-4 flex-row items-center" onPress={onDelete}>
            <Text className="text-red-400 text-lg font-bold">🗑️ Eliminar Rutina</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// --- MODAL DE CONFIRMAR BORRADO ---
interface DeleteProps {
  visible: boolean;
  rutinaNombre?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function RoutineDeleteModal({ visible, rutinaNombre, onClose, onConfirm }: DeleteProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 p-4">
        <View className="bg-slate-800 w-full p-6 rounded-2xl border border-slate-700">
          <Text className="text-white text-xl font-bold mb-2">Eliminar Rutina</Text>
          <Text className="text-slate-400 mb-6 text-base">
            ¿Estás seguro de que deseas eliminar la rutina "{rutinaNombre}"? Esta acción no se puede deshacer y borrará todo el progreso asociado a ella.
          </Text>
          
          <View className="flex-row justify-end space-x-4">
            <TouchableOpacity onPress={onClose} className="px-4 py-2">
              <Text className="text-slate-300 font-bold text-lg">Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onConfirm} className="bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30">
              <Text className="text-red-400 font-bold text-lg">Sí, eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}