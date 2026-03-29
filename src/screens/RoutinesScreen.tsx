import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '@/navigation/types';
import { getRutinasConDetalle, eliminarRutina } from '@/services/rutina/rutinasService';
import RoutineItem from '@/components/rutinas/RoutineItem';

// IMPORTA TUS MODALES (Asegúrate de que la ruta sea correcta)
import { RoutineOptionsModal, RoutineDeleteModal } from '@/components/modals/rutinas/RoutineModals';

type Props = NativeStackScreenProps<RootStackParamList, 'Routines'>;

export default function RoutinesScreen({ navigation }: Props) {
  const [rutinas, setRutinas] = useState<any[]>([]); 
  const[loading, setLoading] = useState(true);
  
  // --- ESTADOS PARA LOS MODALES ---
  const[selectedRutina, setSelectedRutina] = useState<any>(null);
  const[optionsVisible, setOptionsVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
 
  const cargarRutinas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRutinasConDetalle();
      setRutinas(data);
    } catch (error) {
      console.error("Error al cargar rutinas:", error);
    } finally {
      setLoading(false);
    }
  },[]);

  useFocusEffect(
    useCallback(() => {
      cargarRutinas();
    }, [cargarRutinas])
  );

  // 1. Al presionar "los 3 puntitos", guardamos la rutina y abrimos el Modal de Opciones
  const handleOptionsPress = (rutina: any) => {
    setSelectedRutina(rutina);
    setOptionsVisible(true);
  };

  // 2. Acción de Editar desde el Modal de Opciones
  const handleEdit = () => {
    setOptionsVisible(false);
    if (selectedRutina) {
      // @ts-ignore
      navigation.navigate('CreateRoutine', { rutinaId: selectedRutina.id });
    }
  };

  // 3. Acción de pulsar "Eliminar" en el primer modal -> Cierra opciones y abre confirmación
  const handleDeleteOption = () => {
    setOptionsVisible(false);
    // Un pequeño timeout evita que las animaciones de los modales colisionen visualmente
    setTimeout(() => {
      setDeleteVisible(true);
    }, 300);
  };

  // 4. Acción de Confirmar Eliminación Definitiva en el segundo modal
  const handleConfirmDelete = async () => {
    if (!selectedRutina) return;
    
    setDeleteVisible(false);
    setLoading(true);
    
    try {
      // Llamamos al servicio directamente sin usar el hook para saltarnos la Alerta nativa
      await eliminarRutina(selectedRutina.id);
      await cargarRutinas(); // Refrescamos la lista
    } catch (error) {
      console.error("Error al eliminar la rutina:", error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-slate-900">
      <View className="flex-1 p-4">
        
        <View className="mb-6 mt-2">
          <Text className="text-white text-3xl font-bold">Mis Rutinas</Text>
          <Text className="text-slate-400 mt-1">
            Selecciona una rutina para ver los detalles y entrenar.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
        ) : rutinas.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-slate-500 text-lg text-center px-6 mb-20">
              Aún no tienes ninguna rutina creada. ¡Empieza creando la primera!
            </Text>
          </View>
        ) : (
          <FlatList
            data={rutinas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RoutineItem
                rutina={item}
                onOptionsPress={handleOptionsPress}
                onStartWorkout={(r) =>
                  navigation.navigate("RoutineDayPicker", {
                    rutinaId: r.id,
                    nombreRutina: r.nombre,
                  })
                }
                onRoutineHistory={(r) =>
                  navigation.navigate("RoutineHistory", {
                    rutinaId: r.id,
                    nombreRutina: r.nombre,
                  })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }} 
          />
        )}

        {/* BOTÓN FLOTANTE */}
        <TouchableOpacity 
          className="absolute bottom-6 left-4 right-4 bg-emerald-600 p-4 rounded-2xl shadow-lg flex-row justify-center items-center"
          onPress={() => navigation.navigate('CreateRoutine')}
        >
          <Text className="text-white text-xl font-bold mr-2">+</Text>
          <Text className="text-white text-lg font-bold">Crear Nueva Rutina</Text>
        </TouchableOpacity>

      </View>

      {/* --- RENDERIZADO DE MODALES --- */}
      <RoutineOptionsModal
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDeleteOption}
        nombreRutina={selectedRutina?.nombre}
      />

      <RoutineDeleteModal
        visible={deleteVisible}
        rutinaNombre={selectedRutina?.nombre}
        onClose={() => setDeleteVisible(false)}
        onConfirm={handleConfirmDelete}
      />

    </SafeAreaView>
  );
}