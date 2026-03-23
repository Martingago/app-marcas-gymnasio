import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FormRutina, FormRutinaDia, FormRutinaDiaEjercicio } from '@/interfaces/rutina';
import ExerciseSelectorModal from '@/components/modals/ExerciseSelectorModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { guardarRutinaCompleta } from '@/services/rutina/rutinasService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Función helper para generar 4 huecos vacíos con IDs temporales únicos
const generarHuecosVacios = (cantidad: number = 4): FormRutinaDiaEjercicio[] => {
  return Array.from({ length: cantidad }).map(() => ({
    id_temp: Math.random().toString(),
    ejercicio_id: null,
    series_objetivo: '4', // Por defecto 4 series
    reps_objetivo: '10'   // Por defecto 10 repes
  }));
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function CreateRoutineScreen({ navigation }: Props) {
  // ESTADO PRINCIPAL DE LA RUTINA
  const [rutina, setRutina] = useState<FormRutina>({
    nombre: '',
    dias:[{
      id_temp: Math.random().toString(),
      nombre: 'Día 1',
      ejercicios: generarHuecosVacios(4) // 4 por defecto como pediste
    }]
  });

  // ESTADOS DEL MODAL SELECTOR
  const [modalVisible, setModalVisible] = useState(false);
  const[slotSeleccionado, setSlotSeleccionado] = useState<{diaId: string, ejId: string} | null>(null);

  // --- LÓGICA DE DÍAS ---
  const agregarDia = () => {
    setRutina(prev => ({
      ...prev,
      dias:[...prev.dias, {
        id_temp: Math.random().toString(),
        nombre: `Día ${prev.dias.length + 1}`,
        ejercicios: generarHuecosVacios(4)
      }]
    }));
  };

  const eliminarDia = (diaId: string) => {
    setRutina(prev => ({
      ...prev,
      dias: prev.dias.filter(d => d.id_temp !== diaId)
    }));
  };

  // --- LÓGICA DE EJERCICIOS ---
  const agregarHuecoEjercicio = (diaId: string) => {
    setRutina(prev => ({
      ...prev,
      dias: prev.dias.map(d => {
        if (d.id_temp === diaId) {
          return { ...d, ejercicios:[...d.ejercicios, ...generarHuecosVacios(1)] };
        }
        return d;
      })
    }));
  };

  const eliminarEjercicio = (diaId: string, ejId: string) => {
    setRutina(prev => ({
      ...prev,
      dias: prev.dias.map(d => {
        if (d.id_temp === diaId) {
          return { ...d, ejercicios: d.ejercicios.filter(e => e.id_temp !== ejId) };
        }
        return d;
      })
    }));
  };

  const actualizarValorEjercicio = (diaId: string, ejId: string, campo: string, valor: string) => {
    setRutina(prev => ({
      ...prev,
      dias: prev.dias.map(d => {
        if (d.id_temp === diaId) {
          return {
            ...d,
            ejercicios: d.ejercicios.map(e => e.id_temp === ejId ? { ...e, [campo]: valor } : e)
          };
        }
        return d;
      })
    }));
  };

  const manejarSeleccionEjercicio = (ejercicio: any) => {
    if (slotSeleccionado) {
      setRutina(prev => ({
        ...prev,
        dias: prev.dias.map(d => {
          if (d.id_temp === slotSeleccionado.diaId) {
            return {
              ...d,
              ejercicios: d.ejercicios.map(e => 
                e.id_temp === slotSeleccionado.ejId 
                  ? { ...e, ejercicio_id: ejercicio.id, ejercicio_nombre: ejercicio.nombre } 
                  : e
              )
            };
          }
          return d;
        })
      }));
    }
  };

const guardarRutina = async () => {
  try {
    await guardarRutinaCompleta(rutina);
    Alert.alert("¡Éxito!", "Tu rutina ha sido creada correctamente", [
      { 
        text: "Ver Rutinas", 
        onPress: () => navigation.goBack() // Vuelve a la lista de rutinas
      }
    ]);
  } catch (error) {
    Alert.alert("Error", "No se pudo crear la rutina.");
  }
};

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <Text className="text-slate-400 mb-2">Nombre de la Rutina</Text>
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 mb-6 text-lg font-bold"
          placeholder="Ej: Rutina Hipertrofia 4 Días"
          placeholderTextColor="#64748b"
          value={rutina.nombre}
          onChangeText={(txt) => setRutina(prev => ({ ...prev, nombre: txt }))}
        />

        {rutina.dias.map((dia, index) => (
          <View key={dia.id_temp} className="bg-slate-800/50 p-4 rounded-2xl mb-6 border border-slate-700">
            {/* CABECERA DEL DÍA */}
            <View className="flex-row justify-between items-center mb-4">
              <TextInput
                className="text-white text-xl font-bold flex-1 mr-4 border-b border-slate-600 pb-1"
                value={dia.nombre}
                onChangeText={(txt) => {
                  setRutina(prev => ({
                    ...prev,
                    dias: prev.dias.map(d => d.id_temp === dia.id_temp ? { ...d, nombre: txt } : d)
                  }));
                }}
              />
              <TouchableOpacity onPress={() => eliminarDia(dia.id_temp)}>
                <Text className="text-red-400 font-bold">🗑️ Día</Text>
              </TouchableOpacity>
            </View>

            {/* LISTA DE EJERCICIOS DEL DÍA */}
            {dia.ejercicios.map((ej, i) => (
              <View key={ej.id_temp} className="bg-slate-800 p-3 rounded-xl mb-3 flex-row items-center justify-between border border-slate-600">
                
                {/* Selector de Ejercicio */}
                <TouchableOpacity 
                  className="flex-1 mr-3"
                  onPress={() => {
                    setSlotSeleccionado({ diaId: dia.id_temp, ejId: ej.id_temp });
                    setModalVisible(true);
                  }}
                >
                  <Text className={ej.ejercicio_nombre ? "text-white font-bold" : "text-slate-500 italic"}>
                    {ej.ejercicio_nombre || "Pulsar para elegir..."}
                  </Text>
                </TouchableOpacity>

                {/* Inputs de Series y Repes */}
                <View className="flex-row items-center space-x-2">
                  <TextInput
                    className="bg-slate-700 text-white p-2 rounded text-center w-12"
                    keyboardType="numeric"
                    value={ej.series_objetivo}
                    onChangeText={(txt) => actualizarValorEjercicio(dia.id_temp, ej.id_temp, 'series_objetivo', txt)}
                  />
                  <Text className="text-slate-400">x</Text>
                  <TextInput
                    className="bg-slate-700 text-white p-2 rounded text-center w-12"
                    value={ej.reps_objetivo}
                    onChangeText={(txt) => actualizarValorEjercicio(dia.id_temp, ej.id_temp, 'reps_objetivo', txt)}
                  />
                </View>

                {/* Borrar hueco */}
                <TouchableOpacity className="ml-3 p-1" onPress={() => eliminarEjercicio(dia.id_temp, ej.id_temp)}>
                  <Text className="text-red-400 text-lg">×</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* BOTÓN + PARA AÑADIR EJERCICIO AL DÍA */}
            <TouchableOpacity 
              className="mt-2 py-3 bg-slate-700 rounded-xl items-center border border-dashed border-slate-500"
              onPress={() => agregarHuecoEjercicio(dia.id_temp)}
            >
              <Text className="text-slate-300 font-bold">+ Añadir Ejercicio a {dia.nombre}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* BOTÓN + PARA AÑADIR DÍA */}
        <TouchableOpacity 
          className="py-4 bg-blue-600 rounded-xl items-center shadow-lg mb-8"
          onPress={agregarDia}
        >
          <Text className="text-white font-bold text-lg">+ Añadir Nuevo Día</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTÓN FLOTANTE PARA GUARDAR RUTINA */}
      <View className="absolute bottom-20 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800">
        <TouchableOpacity 
          className="bg-emerald-600 p-4 rounded-xl items-center shadow-lg"
          onPress={guardarRutina}
        >
          <Text className="text-white font-bold text-lg">💾 Guardar Rutina</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL SELECTOR */}
      <ExerciseSelectorModal 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSlotSeleccionado(null);
        }}
        onSelect={manejarSeleccionEjercicio}
      />
    </SafeAreaView>
  );
}