// src\components\rutinas\RoutineItem.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRutinaCompleta } from '@/services/rutina/rutinasService';

interface SerieDetalle {
  orden: number;
  reps: string;
  peso: string;
}

interface EjerciciosAgrupados {[ejercicioNombre: string]: SerieDetalle[];
}

interface DiasAgrupados {
  [diaNombre: string]: EjerciciosAgrupados;
}

interface Props {
  rutina: any; // Aquí puedes poner la interfaz estricta si la tienes
  onOptionsPress: (rutina: any) => void;
  onStartWorkout?: (rutina: any) => void;
  onRoutineHistory?: (rutina: any) => void;
}

export default function RoutineItem({ rutina, onOptionsPress, onStartWorkout, onRoutineHistory }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const[diasAgrupados, setDiasAgrupados] = useState<DiasAgrupados | null>(null);

  const toggleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // Si no tenemos los datos cacheados, los descargamos
    if (!diasAgrupados) {
      setLoading(true);
      try {
        const detalles = await getRutinaCompleta(rutina.id);
        
        // Agrupamos la info
        const agrupado = detalles.reduce<DiasAgrupados>((acc, curr) => {
          if (!acc[curr.diaNombre]) acc[curr.diaNombre] = {};
          if (!curr.ejercicioNombre) return acc;
          if (!acc[curr.diaNombre][curr.ejercicioNombre]) acc[curr.diaNombre][curr.ejercicioNombre] = [];
          if (curr.serieOrden != null) {
            acc[curr.diaNombre][curr.ejercicioNombre].push({
              orden: curr.serieOrden,
              reps: curr.repsObjetivo || '-',
              peso: curr.pesoObjetivo || '0'
            });
          }
          return acc;
        }, {});
        
        setDiasAgrupados(agrupado);
      } catch (error) {
        console.error("Error al cargar detalles de la rutina:", error);
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded(true);
  };

  return (
    <View className="bg-slate-800 rounded-2xl mb-4 border border-slate-700 overflow-hidden">
      
      {/* CABECERA (Acordeón + Botón de Opciones) */}
      <View className="p-5 flex-row justify-between items-center">
        
        {/* Zona clickeable para expandir */}
        <TouchableOpacity 
          className="flex-1 flex-row items-center pr-2"
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{rutina.nombre}</Text>
            <Text className="text-slate-400 mt-1">{rutina.totalDias} días de entrenamiento</Text>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#64748b" />
        </TouchableOpacity>

        {/* Separador visual */}
        <View className="w-[1px] h-8 bg-slate-700 mx-2" />

        {/* Botón de Opciones (3 puntitos) */}
        <TouchableOpacity 
          className="p-2"
          onPress={() => onOptionsPress(rutina)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#94a3b8" />
        </TouchableOpacity>

      </View>

      <View className="flex-row px-5 pb-4 gap-2">
        <TouchableOpacity
          className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
          onPress={() => onStartWorkout?.(rutina)}
        >
          <Text className="text-white font-bold">Entrenar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-slate-700 py-3 rounded-xl items-center border border-slate-600"
          onPress={() => onRoutineHistory?.(rutina)}
        >
          <Text className="text-slate-200 font-bold">Historial</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO DESPLEGABLE */}
      {isExpanded && (
        <View className="px-5 pb-5 border-t border-slate-700 pt-3 bg-slate-800/80">
          {loading ? (
            <ActivityIndicator size="small" color="#3b82f6" className="my-4" />
          ) : diasAgrupados ? (
            Object.entries(diasAgrupados).map(([diaNombre, ejercicios]) => (
              <View key={diaNombre} className="mb-6">
                <Text className="text-emerald-400 font-bold text-lg mb-3 border-b border-slate-700 pb-1">
                  {diaNombre}
                </Text>
                
                {Object.entries(ejercicios).map(([ejNombre, series], ejIndex) => (
                  <View key={ejIndex} className="mb-4 ml-2">
                    <Text className="text-slate-200 font-bold text-base mb-1">• {ejNombre}</Text>
                    <View className="ml-4 flex-row flex-wrap">
                      {series.map((serie, sIndex) => (
                        <View key={sIndex} className="bg-slate-700/50 px-3 py-1 rounded-md mr-2 mb-2 border border-slate-600">
                          <Text className="text-slate-300 text-sm">
                            <Text className="text-slate-400 font-bold">S{serie.orden}: </Text>
                            {serie.reps} reps <Text className="text-emerald-400/80">@ {serie.peso}kg</Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))
          ) : null}
        </View>
      )}
    </View>
  );
}