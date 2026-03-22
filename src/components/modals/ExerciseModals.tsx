import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ejercicio, CrearEjercicioDTO, EditarEjercicioDTO } from '@/interfaces/ejercicio';
import { Categoria } from '@/interfaces/categoria';

// 1. MODAL DE OPCIONES (Toast menú)
export const OptionsModal = ({ visible, onClose, onEdit, onDelete }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableOpacity className="flex-1 justify-center items-center bg-black/60" onPress={onClose} activeOpacity={1}>
      <View className="bg-slate-800 w-3/4 rounded-2xl p-4 border border-slate-700">
        <TouchableOpacity className="py-3 border-b border-slate-700" onPress={onEdit}>
          <Text className="text-white text-center text-lg">✏️ Editar Ejercicio</Text>
        </TouchableOpacity>
        <TouchableOpacity className="py-3" onPress={onDelete}>
          <Text className="text-red-500 text-center text-lg font-bold">🗑️ Eliminar Ejercicio</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// 2. MODAL DE BORRADO
export const DeleteModal = ({ visible, onClose, onConfirm, ejercicio }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 justify-center items-center bg-black/70 p-6">
      <View className="bg-slate-800 w-full rounded-3xl p-6 border border-slate-700">
        <Text className="text-white text-xl font-bold mb-2 text-center">¿Eliminar ejercicio?</Text>
        <Text className="text-slate-400 text-center mb-6">
          Se borrará '{ejercicio?.nombre}' de tu lista. Tus registros históricos no se verán afectados.
        </Text>
        <View className="flex-row justify-between">
          <TouchableOpacity className="flex-1 bg-slate-700 py-3 rounded-xl mr-2" onPress={onClose}>
            <Text className="text-white text-center font-bold">Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-red-600 py-3 rounded-xl ml-2" onPress={onConfirm}>
            <Text className="text-white text-center font-bold">Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// 3. MODAL DE FORMULARIO (Sirve para Añadir y Editar)
export const FormModal = ({ visible, onClose, onSave, categorias, ejercicioAEditar }: { visible: boolean, onClose: () => void, onSave: (data: any) => void, categorias: Categoria[], ejercicioAEditar: Ejercicio | null }) => {
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  // Al abrir el modal, si hay ejercicio lo cargamos (Edit mode), si no, limpiamos (Add mode)
  useEffect(() => {
    if (visible) {
      setNombre(ejercicioAEditar?.nombre || '');
      setCategoriaId(ejercicioAEditar?.categoria_id || null);
    }
  }, [visible, ejercicioAEditar]);

  const handleSave = () => {
    if (!nombre.trim()) return; // Validación simple
    onSave({ id: ejercicioAEditar?.id, nombre, categoria_id: categoriaId });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-slate-900 rounded-t-3xl p-6 border-t border-slate-700 h-3/4">
          <Text className="text-white text-2xl font-bold mb-6">
            {ejercicioAEditar ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
          </Text>

          <Text className="text-slate-400 mb-2">Nombre del ejercicio</Text>
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 mb-6"
            placeholder="Ej: Press de Banca..."
            placeholderTextColor="#64748b"
            value={nombre}
            onChangeText={setNombre}
          />

          <Text className="text-slate-400 mb-2">Categoría (Opcional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-grow-0">
            {categorias.map(cat => (
              <TouchableOpacity 
                key={cat.id}
                className={`px-4 py-3 rounded-xl mr-2 ${categoriaId === cat.id ? 'bg-blue-600' : 'bg-slate-800'}`}
                onPress={() => setCategoriaId(categoriaId === cat.id ? null : cat.id)} // Permite deseleccionar
              >
                <Text className={categoriaId === cat.id ? 'text-white font-bold' : 'text-slate-300'}>{cat.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row mt-auto">
            <TouchableOpacity className="flex-1 bg-slate-800 py-4 rounded-xl mr-2" onPress={onClose}>
              <Text className="text-white text-center font-bold text-lg">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 py-4 rounded-xl ml-2 ${!nombre.trim() ? 'bg-emerald-800/50' : 'bg-emerald-600'}`} 
              onPress={handleSave}
              disabled={!nombre.trim()}
            >
              <Text className="text-white text-center font-bold text-lg">Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};