import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { getRutinaCompleta, getRutinasConDetalle } from '@/services/rutina/rutinasService';

// Importamos los servicios reales que creaste

type Props = NativeStackScreenProps<RootStackParamList, 'Routines'>;

export default function RoutinesScreen({ navigation }: Props) {
  const [rutinas, setRutinas] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Estados para el acordeón
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const[detalleRutina, setDetalleRutina] = useState<any[]>([]);

  // useFocusEffect recarga la lista automáticamente cada vez que entras a esta pantalla
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

  // Lógica del Acordeón
  const toggleExpand = async (rutinaId: number) => {
    if (expandedIds.includes(rutinaId)) {
      // Si está abierto, lo cerramos
      setExpandedIds(expandedIds.filter(id => id !== rutinaId));
    } else {
      // Si está cerrado, descargamos sus datos y lo abrimos
      const detalles = await getRutinaCompleta(rutinaId);
      
      // Añadimos la propiedad rutinaId a cada detalle para saber a quién pertenece
      const detallesConId = detalles.map((d: any) => ({ ...d, rutinaId }));
      
      setDetalleRutina(prev =>[
        ...prev.filter(d => d.rutinaId !== rutinaId), // Limpiamos info vieja si la hubiera
        ...detallesConId
      ]);
      setExpandedIds([...expandedIds, rutinaId]);
    }
  };

  // Renderizado de cada tarjeta de Rutina
  const renderRutina = ({ item }: { item: any }) => {
    const isExpanded = expandedIds.includes(item.id);
    
    // Filtramos los detalles que pertenecen solo a esta rutina
    const detallesDeEstaRutina = detalleRutina.filter(d => d.rutinaId === item.id);

    // Agrupamos los ejercicios por Día para que no salga "Día 1" repetido por cada ejercicio
    const ejerciciosPorDia = detallesDeEstaRutina.reduce((acc, curr) => {
      if (!acc[curr.diaNombre]) acc[curr.diaNombre] =[];
      acc[curr.diaNombre].push(curr);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <View className="bg-slate-800 rounded-2xl mb-4 border border-slate-700 overflow-hidden">
        
        {/* ZONA CLICKEABLE PARA EXPANDIR (El Acordeón) */}
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

        {/* CONTENIDO DESPLEGABLE (Los detalles) */}
        {isExpanded && (
          <View className="px-5 pb-5 border-t border-slate-700 pt-3 bg-slate-800/80">
            {Object.entries(ejerciciosPorDia).map(([diaNombre, ejercicios]) => (
              <View key={diaNombre} className="mb-4">
                <Text className="text-emerald-400 font-bold text-lg mb-2">{diaNombre}</Text>
                
                {ejercicios.map((ej, index) => (
                  <View key={index} className="flex-row justify-between mb-1 ml-2">
                    <Text className="text-slate-300 flex-1">• {ej.ejercicioNombre}</Text>
                    <Text className="text-slate-400 font-semibold ml-2">
                      {ej.seriesObjetivo}x{ej.repsObjetivo}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            {/* BOTÓN "EMPEZAR" DENTRO DEL DETALLE PARA NO ESTORBAR AL ACORDEÓN */}
            <TouchableOpacity 
              className="mt-4 bg-blue-600 p-3 rounded-xl items-center shadow-lg"
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
    // SafeAreaView asegura que nada se monte sobre el menú de navegación nativo de tu móvil
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 p-4">
        
        {/* CABECERA */}
        <View className="mb-6 mt-2">
          <Text className="text-white text-3xl font-bold">Mis Rutinas</Text>
          <Text className="text-slate-400 mt-1">
            Selecciona una rutina para ver los detalles y entrenar.
          </Text>
        </View>

        {/* LISTADO DE RUTINAS */}
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

        {/* BOTÓN FLOTANTE PARA CREAR NUEVA RUTINA */}
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