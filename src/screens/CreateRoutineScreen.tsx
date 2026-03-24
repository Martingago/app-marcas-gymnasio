import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import ExerciseSelectorModal from "@/components/modals/ExerciseSelectorModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useRutinas } from "@/hooks/useRutinas";
import {
  FormRutina,
  FormRutinaDiaEjercicio,
  FormRutinaDiaEjercicioSerie,
} from "@/interfaces/form/formRutina";
import { RootStackParamList } from "@/navigation/types";

const generarSerieVacia = (): FormRutinaDiaEjercicioSerie => ({
  id_temp: Math.random().toString(),
  reps_objetivo: "10",
  peso_objetivo: "0",
});

const generarHuecosVacios = (
  cantidad: number = 4,
): FormRutinaDiaEjercicio[] => {
  return Array.from({ length: cantidad }).map(() => ({
    id_temp: Math.random().toString(),
    ejercicio_id: null,
    // Por defecto inicializamos con 3 series
    series: [generarSerieVacia(), generarSerieVacia(), generarSerieVacia()],
  }));
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function CreateRoutineScreen({ navigation }: Props) {
  const { crearRutina, isLoading } = useRutinas(navigation);

  const [rutina, setRutina] = useState<FormRutina>({
    nombre: "",
    dias: [
      {
        id_temp: Math.random().toString(),
        nombre: "Día 1",
        ejercicios: generarHuecosVacios(2), // Empezamos con 2 por limpieza visual
      },
    ],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{
    diaId: string;
    ejId: string;
  } | null>(null);

  const agregarDia = () => {
    setRutina((prev) => ({
      ...prev,
      dias: [
        ...prev.dias,
        {
          id_temp: Math.random().toString(),
          nombre: `Día ${prev.dias.length + 1}`, // Se llamará Día 2, Día 3, etc.
          ejercicios: generarHuecosVacios(2),
        },
      ],
    }));
  };

  const eliminarDia = (diaId: string) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.filter((d) => d.id_temp !== diaId),
    }));
  };

  // --- LÓGICA DE EJERCICIOS ---
  const agregarHuecoEjercicio = (diaId: string) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) => {
        if (d.id_temp === diaId) {
          return {
            ...d,
            ejercicios: [...d.ejercicios, ...generarHuecosVacios(1)],
          };
        }
        return d;
      }),
    }));
  };
  const eliminarEjercicio = (diaId: string, ejId: string) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) => {
        if (d.id_temp === diaId) {
          return {
            ...d,
            ejercicios: d.ejercicios.filter((e) => e.id_temp !== ejId),
          };
        }
        return d;
      }),
    }));
  };
  const actualizarValorEjercicio = (
    diaId: string,
    ejId: string,
    campo: string,
    valor: string,
  ) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) => {
        if (d.id_temp === diaId) {
          return {
            ...d,
            ejercicios: d.ejercicios.map((e) =>
              e.id_temp === ejId ? { ...e, [campo]: valor } : e,
            ),
          };
        }
        return d;
      }),
    }));
  };
  const manejarSeleccionEjercicio = (ejercicio: any) => {
    if (slotSeleccionado) {
      setRutina((prev) => ({
        ...prev,
        dias: prev.dias.map((d) => {
          if (d.id_temp === slotSeleccionado.diaId) {
            return {
              ...d,
              ejercicios: d.ejercicios.map((e) =>
                e.id_temp === slotSeleccionado.ejId
                  ? {
                      ...e,
                      ejercicio_id: ejercicio.id,
                      ejercicio_nombre: ejercicio.nombre,
                    }
                  : e,
              ),
            };
          }
          return d;
        }),
      }));
    }
  };

  // --- NUEVA LÓGICA DE SERIES ---
  const agregarSerie = (diaId: string, ejId: string) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) =>
        d.id_temp === diaId
          ? {
              ...d,
              ejercicios: d.ejercicios.map((e) =>
                e.id_temp === ejId
                  ? {
                      ...e,
                      series: [...e.series, generarSerieVacia()],
                    }
                  : e,
              ),
            }
          : d,
      ),
    }));
  };

  const eliminarSerie = (diaId: string, ejId: string, serieId: string) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) =>
        d.id_temp === diaId
          ? {
              ...d,
              ejercicios: d.ejercicios.map((e) =>
                e.id_temp === ejId
                  ? {
                      ...e,
                      series: e.series.filter((s) => s.id_temp !== serieId),
                    }
                  : e,
              ),
            }
          : d,
      ),
    }));
  };

  const actualizarSerie = (
    diaId: string,
    ejId: string,
    serieId: string,
    campo: "reps_objetivo" | "peso_objetivo",
    valor: string,
  ) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) =>
        d.id_temp === diaId
          ? {
              ...d,
              ejercicios: d.ejercicios.map((e) =>
                e.id_temp === ejId
                  ? {
                      ...e,
                      series: e.series.map((s) =>
                        s.id_temp === serieId ? { ...s, [campo]: valor } : s,
                      ),
                    }
                  : e,
              ),
            }
          : d,
      ),
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text className="text-slate-400 mb-2">Nombre de la Rutina</Text>
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 mb-6 text-lg font-bold"
          placeholder="Ej: Rutina Hipertrofia 4 Días"
          placeholderTextColor="#64748b"
          value={rutina.nombre}
          onChangeText={(txt) =>
            setRutina((prev) => ({ ...prev, nombre: txt }))
          }
        />

        {rutina.dias.map((dia) => (
          <View
            key={dia.id_temp}
            className="bg-slate-800/50 p-4 rounded-2xl mb-6 border border-slate-700"
          >
            {/* CABECERA DEL DÍA */}
            <View className="flex-row justify-between items-center mb-4">
              <TextInput
                className="text-white text-xl font-bold flex-1 mr-4 border-b border-slate-600 pb-1"
                value={dia.nombre}
                onChangeText={(txt) =>
                  setRutina((prev) => ({
                    ...prev,
                    dias: prev.dias.map((d) =>
                      d.id_temp === dia.id_temp ? { ...d, nombre: txt } : d,
                    ),
                  }))
                }
              />

              {/* BOTÓN PARA BORRAR EL DÍA */}
              <TouchableOpacity
                onPress={() => eliminarDia(dia.id_temp)}
                className="bg-red-500/20 px-3 py-2 rounded-lg border border-red-500/30"
              >
                <Text className="text-red-400 font-bold text-sm">
                  🗑️ Borrar
                </Text>
              </TouchableOpacity>
            </View>

            {/* LISTA DE EJERCICIOS DEL DÍA */}
            {dia.ejercicios.map((ej) => (
              <View
                key={ej.id_temp}
                className="bg-slate-800 p-3 rounded-xl mb-4 border border-slate-600"
              >
                {/* Cabecera del Ejercicio */}
                <View className="flex-row justify-between items-center mb-3">
                  <TouchableOpacity
                    className="flex-1"
                    onPress={() => {
                      setSlotSeleccionado({
                        diaId: dia.id_temp,
                        ejId: ej.id_temp,
                      });
                      setModalVisible(true);
                    }}
                  >
                    <Text
                      className={
                        ej.ejercicio_nombre
                          ? "text-white font-bold text-lg"
                          : "text-blue-400 italic text-lg"
                      }
                    >
                      {ej.ejercicio_nombre || "+ Elegir Ejercicio..."}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => eliminarEjercicio(dia.id_temp, ej.id_temp)}
                  >
                    <Text className="text-red-400 text-xl font-bold">×</Text>
                  </TouchableOpacity>
                </View>

                {/* TABLA DE SERIES */}
                <View className="bg-slate-900/50 rounded-lg p-2">
                  {/* Títulos de la Tabla */}
                  <View className="flex-row mb-2 px-2">
                    <Text className="flex-1 text-slate-400 text-xs font-bold text-center">
                      SERIE
                    </Text>
                    <Text className="flex-1 text-slate-400 text-xs font-bold text-center">
                      REPS
                    </Text>
                    <Text className="flex-1 text-slate-400 text-xs font-bold text-center">
                      PESO (KG)
                    </Text>
                    <View className="w-8" />
                  </View>

                  {/* Filas de Series */}
                  {ej.series.map((serie, index) => (
                    <View
                      key={serie.id_temp}
                      className="flex-row items-center mb-2 space-x-2"
                    >
                      <View className="flex-1 bg-slate-800 py-2 rounded items-center justify-center">
                        <Text className="text-slate-300 font-bold">
                          {index + 1}
                        </Text>
                      </View>

                      <TextInput
                        className="flex-1 bg-slate-700 text-white p-2 rounded text-center"
                        keyboardType="default"
                        value={serie.reps_objetivo}
                        onChangeText={(txt) =>
                          actualizarSerie(
                            dia.id_temp,
                            ej.id_temp,
                            serie.id_temp,
                            "reps_objetivo",
                            txt,
                          )
                        }
                      />

                      <TextInput
                        className="flex-1 bg-slate-700 text-white p-2 rounded text-center"
                        keyboardType="default"
                        value={serie.peso_objetivo}
                        onChangeText={(txt) =>
                          actualizarSerie(
                            dia.id_temp,
                            ej.id_temp,
                            serie.id_temp,
                            "peso_objetivo",
                            txt,
                          )
                        }
                      />

                      <TouchableOpacity
                        className="w-8 items-center justify-center"
                        onPress={() =>
                          eliminarSerie(dia.id_temp, ej.id_temp, serie.id_temp)
                        }
                      >
                        <Text className="text-red-400 text-lg">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Botón Añadir Serie */}
                  <TouchableOpacity
                    onPress={() => agregarSerie(dia.id_temp, ej.id_temp)}
                    className="mt-2 py-2"
                  >
                    <Text className="text-blue-400 text-center font-bold text-sm">
                      + Añadir Serie
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              className="mt-2 py-3 bg-slate-700 rounded-xl items-center border border-dashed border-slate-500"
              onPress={() => agregarHuecoEjercicio(dia.id_temp)}
            >
              <Text className="text-slate-300 font-bold">
                + Añadir Ejercicio
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          className="py-4 bg-blue-600 rounded-xl items-center shadow-lg mb-8"
          onPress={agregarDia}
        >
          <Text className="text-white font-bold text-lg">
            + Añadir Nuevo Día
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTÓN GUARDAR (Usa el Hook) */}
      <View className="absolute bottom-4 left-4 right-4 bg-transparent">
        <TouchableOpacity
          className={`p-4 rounded-xl items-center shadow-lg ${isLoading ? "bg-emerald-800" : "bg-emerald-600"}`}
          onPress={() => crearRutina(rutina)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              💾 Guardar Rutina
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL (Asumiendo que lo tienes igual) */}
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
