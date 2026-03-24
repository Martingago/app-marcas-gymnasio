import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { getRutinaCompleta, getRutinasConDetalle } from '@/services/rutina/rutinasService';

type Props = NativeStackScreenProps<RootStackParamList, 'Routines'>;

// 1. DEFINIMOS LOS TIPOS PARA EL AGRUPAMIENTO Y QUITAR EL ERROR DE 'UNKNOWN'
interface SerieDetalle {
  orden: number;
  reps: string;
  peso: string;
}

interface EjerciciosAgrupados {
  [ejercicioNombre: string]: SerieDetalle[];
}

interface DiasAgrupados {[diaNombre: string]: EjerciciosAgrupados;
}

export default function RoutinesScreen({ navigation }: Props) {
  const [rutinas, setRutinas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Estados para el acordeón
  const[expandedIds, setExpandedIds] = useState<number[]>([]);
  const[detalleRutina, setDetalleRutina] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const cargarRutinas = async () => {
        setLoading(true);
        try {
          const data = await getRutinasConDetalle();
          setRutinas(data);
        } catch (error) {
          console.error("Error al cargar rutinas:", error);
        } finally {
          setLoading(false);
        }
      };
      cargarRutinas();
    },[])
  );

  const toggleExpand = async (rutinaId: number) => {
    if (expandedIds.includes(rutinaId)) {
      setExpandedIds(expandedIds.filter(id => id !== rutinaId));
    } else {
      const detalles = await getRutinaCompleta(rutinaId);
      const detallesConId = detalles.map((d: any) => ({ ...d, rutinaId }));
      
      setDetalleRutina(prev =>[
        ...prev.filter(d => d.rutinaId !== rutinaId),
        ...detallesConId
      ]);
      setExpandedIds([...expandedIds, rutinaId]);
    }
  };

  const renderRutina = ({ item }: { item: any }) => {
    const isExpanded = expandedIds.includes(item.id);
    const detallesDeEstaRutina = detalleRutina.filter(d => d.rutinaId === item.id);

    // 2. AGRUPAMOS POR DÍA -> EJERCICIO -> SERIES
    const diasAgrupados = detallesDeEstaRutina.reduce<DiasAgrupados>((acc, curr) => {
      // Si el día no existe, lo creamos
      if (!acc[curr.diaNombre]) {
        acc[curr.diaNombre] = {};
      }
      // Si el ejercicio no existe dentro del día, lo creamos
      if (!acc[curr.diaNombre][curr.ejercicioNombre]) {
        acc[curr.diaNombre][curr.ejercicioNombre] =[];
      }
      // Si hay datos de la serie, los insertamos
      if (curr.serieOrden) {
        acc[curr.diaNombre][curr.ejercicioNombre].push({
          orden: curr.serieOrden,
          reps: curr.repsObjetivo || '-',
          peso: curr.pesoObjetivo || '0'
        });
      }
      return acc;
    }, {});

    return (
      <View className="bg-slate-800 rounded-2xl mb-4 border border-slate-700 overflow-hidden">
        
        {/* ZONA EXPANDIR (Acordeón) */}
        <TouchableOpacity 
          className="p-5 flex-row justify-between items-center"
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{item.nombre}</Text>
            <Text className="text-slate-400 mt-1">{item.totalDias} días de entrenamiento</Text>
          </View>
          <Text className="text-slate-500 text-2xl mr-4">{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {/* CONTENIDO DESPLEGABLE */}
        {isExpanded && (
          <View className="px-5 pb-5 border-t border-slate-700 pt-3 bg-slate-800/80">
            {/* Iteramos sobre los Días */}
            {Object.entries(diasAgrupados).map(([diaNombre, ejercicios]) => (
              <View key={diaNombre} className="mb-6">
                <Text className="text-emerald-400 font-bold text-lg mb-3 border-b border-slate-700 pb-1">
                  {diaNombre}
                </Text>
                
                {/* Iteramos sobre los Ejercicios de ese Día */}
                {Object.entries(ejercicios).map(([ejNombre, series], ejIndex) => (
                  <View key={ejIndex} className="mb-4 ml-2">
                    <Text className="text-slate-200 font-bold text-base mb-1">
                      • {ejNombre}
                    </Text>
                    
                    {/* Renderizamos las Series como una pequeña lista anidada */}
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
            ))}

            {/* BOTÓN "EMPEZAR" */}
            <TouchableOpacity 
              className="mt-2 bg-blue-600 p-4 rounded-xl items-center shadow-lg"
              onPress={() => console.log("Navegar a ActiveWorkout con ID:", item.id)}
            >
              <Text className="text-white font-bold text-lg">🚀 Empezar esta Rutina</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
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
            renderItem={renderRutina}
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
    </SafeAreaView>
  );
}