import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppDialog, { AppDialogAction } from "@/components/ui/AppDialog";
import ExerciseSelectorModal from "@/components/modals/ExerciseSelectorModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useRutinas } from "@/hooks/useRutinas";
import {
  FormRutina,
  FormRutinaDiaEjercicio,
  FormRutinaDiaEjercicioSerie,
} from "@/interfaces/form/formRutina";
import { RootStackParamList } from "@/navigation/types";
import { getRutinaParaEditar } from "@/services/rutina/rutinasService";

const generarSerieVacia = (): FormRutinaDiaEjercicioSerie => ({
  id_temp: Math.random().toString(),
  reps_objetivo: "10",
  peso_objetivo: "0",
});

/** Un hueco de ejercicio con una sola serie por defecto */
const generarHuecosVacios = (cantidad: number = 1): FormRutinaDiaEjercicio[] => {
  return Array.from({ length: cantidad }).map(() => ({
    id_temp: Math.random().toString(),
    ejercicio_id: null,
    series: [generarSerieVacia()],
  }));
};

function createInitialRutina(): FormRutina {
  return {
    nombre: "",
    dias: [
      {
        id_temp: Math.random().toString(),
        nombre: "Día 1",
        ejercicios: generarHuecosVacios(1),
      },
    ],
  };
}

/** Comparación de contenido sin id_temp (cambios sin guardar) */
function rutinaFingerprint(r: FormRutina): string {
  return JSON.stringify({
    nombre: r.nombre.trim(),
    dias: r.dias.map((d) => ({
      nombre: d.nombre,
      ejercicios: d.ejercicios.map((ej) => ({
        ejercicio_id: ej.ejercicio_id,
        series: ej.series.map((s) => ({
          r: String(s.reps_objetivo ?? "").trim(),
          p: String(s.peso_objetivo ?? "").trim(),
        })),
      })),
    })),
  });
}

type Props = NativeStackScreenProps<RootStackParamList, "CreateRoutine">;

export default function CreateRoutineScreen({ navigation, route }: Props) {
  const { guardarOEditarRutina, isLoading } = useRutinas();

  const rutinaIdEditando = route.params?.rutinaId;
  const insets = useSafeAreaInsets();

  const [isCargandoEdicion, setIsCargandoEdicion] = useState(!!rutinaIdEditando);
  const [activeDiaIndex, setActiveDiaIndex] = useState(0);
  const [rutina, setRutina] = useState<FormRutina>(() => createInitialRutina());

  const [baselineFingerprint, setBaselineFingerprint] = useState("");
  const wasCargandoRef = useRef(!!rutinaIdEditando);
  const pendingLeaveActionRef = useRef<{ type: string; payload?: object } | null>(null);
  /** Tras guardar OK, permitir salir sin modal de cambios sin guardar */
  const omitirAvisoCambiosRef = useRef(false);

  const [modalSalirSinGuardar, setModalSalirSinGuardar] = useState(false);
  const [modalEliminarDia, setModalEliminarDia] = useState<{ diaId: string; diaNombre: string } | null>(null);
  const [modalEliminarEjercicio, setModalEliminarEjercicio] = useState<{
    diaId: string;
    ejId: string;
    ejNombre?: string;
  } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{
    diaId: string;
    ejId: string;
  } | null>(null);

  const [dialogoApp, setDialogoApp] = useState<{
    title: string;
    message: string;
    actions: AppDialogAction[];
  } | null>(null);

  useEffect(() => {
    if (!rutinaIdEditando) {
      setBaselineFingerprint(rutinaFingerprint(createInitialRutina()));
      wasCargandoRef.current = false;
    }
  }, [rutinaIdEditando]);

  useEffect(() => {
    const cargarDatosRutina = async () => {
      if (rutinaIdEditando) {
        try {
          const rutinaData = await getRutinaParaEditar(rutinaIdEditando);
          setRutina(rutinaData);
          setActiveDiaIndex(0);
        } catch (error) {
          console.error("Error al cargar la rutina para editar:", error);
          setDialogoApp({
            title: "Error",
            message: "No se pudo cargar la información de la rutina.",
            actions: [{ label: "Entendido", onPress: () => setDialogoApp(null) }],
          });
        } finally {
          setIsCargandoEdicion(false);
        }
      }
    };

    cargarDatosRutina();
  }, [rutinaIdEditando]);

  useEffect(() => {
    if (!rutinaIdEditando || isCargandoEdicion) return;
    if (wasCargandoRef.current && !isCargandoEdicion) {
      wasCargandoRef.current = false;
      setBaselineFingerprint(rutinaFingerprint(rutina));
    }
  }, [rutinaIdEditando, isCargandoEdicion, rutina]);

  const isDirty = useMemo(() => {
    if (!baselineFingerprint) return false;
    return rutinaFingerprint(rutina) !== baselineFingerprint;
  }, [rutina, baselineFingerprint]);

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", (e) => {
      if (omitirAvisoCambiosRef.current) return;
      if (!isDirty) return;
      e.preventDefault();
      pendingLeaveActionRef.current = e.data.action;
      setModalSalirSinGuardar(true);
    });
    return sub;
  }, [navigation, isDirty]);

  const confirmarSalirSinGuardar = () => {
    const action = pendingLeaveActionRef.current;
    setModalSalirSinGuardar(false);
    pendingLeaveActionRef.current = null;
    if (action) {
      navigation.dispatch(action);
    }
  };

  const validarYGuardar = () => {
    const aviso = (title: string, message: string) =>
      setDialogoApp({
        title,
        message,
        actions: [{ label: "Entendido", onPress: () => setDialogoApp(null) }],
      });

    if (!rutina.nombre.trim()) {
      aviso("Faltan datos", "Por favor, introduce un nombre para la rutina.");
      return;
    }

    if (rutina.dias.length === 0) {
      aviso("Faltan datos", "La rutina debe tener al menos un día de entrenamiento.");
      return;
    }

    for (const dia of rutina.dias) {
      if (dia.ejercicios.length === 0) {
        aviso("Faltan datos", `El ${dia.nombre} debe tener al menos un ejercicio.`);
        return;
      }

      const tieneHuecosVacios = dia.ejercicios.some((ej) => ej.ejercicio_id === null);
      if (tieneHuecosVacios) {
        aviso("Faltan datos", `Has dejado huecos de ejercicios sin seleccionar en ${dia.nombre}.`);
        return;
      }
    }

    guardarOEditarRutina(rutina, rutinaIdEditando, {
      onSuccess: () => {
        omitirAvisoCambiosRef.current = true;
      },
      onSaved: () =>
        setDialogoApp({
          title: rutinaIdEditando ? "Rutina actualizada" : "Rutina creada",
          message: rutinaIdEditando
            ? "Los cambios se han guardado correctamente."
            : "Tu rutina se ha guardado correctamente.",
          actions: [
            {
              label: "OK",
              variant: "primary",
              onPress: () => {
                setDialogoApp(null);
                navigation.goBack();
              },
            },
          ],
        }),
      onError: (msg) =>
        setDialogoApp({
          title: "Error",
          message: msg,
          actions: [{ label: "Entendido", onPress: () => setDialogoApp(null) }],
        }),
    });
  };

  const ejecutarEliminarDia = () => {
    if (!modalEliminarDia) return;
    const { diaId } = modalEliminarDia;
    const dIdx = rutina.dias.findIndex((d) => d.id_temp === diaId);
    const n = rutina.dias.length;
    setModalEliminarDia(null);
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.filter((d) => d.id_temp !== diaId),
    }));
    setActiveDiaIndex((prev) => {
      const newLen = n - 1;
      if (newLen <= 0) return 0;
      if (dIdx < prev) return prev - 1;
      if (dIdx === prev) return Math.min(dIdx, newLen - 1);
      return prev;
    });
  };

  const ejecutarEliminarEjercicio = () => {
    if (!modalEliminarEjercicio) return;
    const { diaId, ejId } = modalEliminarEjercicio;
    setModalEliminarEjercicio(null);
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

  const agregarDia = () => {
    const siguiente = rutina.dias.length + 1;
    const idxNuevo = rutina.dias.length;
    setRutina((prev) => ({
      ...prev,
      dias: [
        ...prev.dias,
        {
          id_temp: Math.random().toString(),
          nombre: `Día ${siguiente}`,
          ejercicios: generarHuecosVacios(1),
        },
      ],
    }));
    setActiveDiaIndex(idxNuevo);
  };

  /** Cambia el orden de los días en la rutina (el guardado usa el índice como `orden` en BD). */
  const moverDiaEnRutina = (diaId: string, delta: -1 | 1) => {
    setRutina((prev) => {
      const idx = prev.dias.findIndex((d) => d.id_temp === diaId);
      if (idx < 0) return prev;
      const next = idx + delta;
      if (next < 0 || next >= prev.dias.length) return prev;
      const copia = [...prev.dias];
      [copia[idx], copia[next]] = [copia[next], copia[idx]];
      return { ...prev, dias: copia };
    });
    setActiveDiaIndex((prevA) => {
      const idx = rutina.dias.findIndex((d) => d.id_temp === diaId);
      const next = idx + delta;
      if (idx < 0 || next < 0 || next >= rutina.dias.length) return prevA;
      if (prevA === idx) return next;
      if (prevA === next) return idx;
      return prevA;
    });
  };

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

  /** Reordenar ejercicios dentro de un día (el guardado usa el índice como `orden` en BD). */
  const moverEjercicioEnDia = (diaId: string, ejId: string, delta: -1 | 1) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) => {
        if (d.id_temp !== diaId) return d;
        const idx = d.ejercicios.findIndex((e) => e.id_temp === ejId);
        if (idx < 0) return d;
        const next = idx + delta;
        if (next < 0 || next >= d.ejercicios.length) return d;
        const copia = [...d.ejercicios];
        const tmp = copia[idx];
        copia[idx] = copia[next];
        copia[next] = tmp;
        return { ...d, ejercicios: copia };
      }),
    }));
  };

  const manejarSeleccionEjercicio = (ejercicio: { id: number; nombre: string }) => {
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
                  : e
              ),
            };
          }
          return d;
        }),
      }));
    }
  };

  const agregarSerie = (diaId: string, ejId: string) => {
    setRutina((prev) => ({
      ...prev,
      dias: prev.dias.map((d) =>
        d.id_temp === diaId
          ? {
              ...d,
              ejercicios: d.ejercicios.map((e) =>
                e.id_temp === ejId ? { ...e, series: [...e.series, generarSerieVacia()] } : e
              ),
            }
          : d
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
                  : e
              ),
            }
          : d
      ),
    }));
  };

  const actualizarSerie = (
    diaId: string,
    ejId: string,
    serieId: string,
    campo: "reps_objetivo" | "peso_objetivo",
    valor: string
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
                        s.id_temp === serieId ? { ...s, [campo]: valor } : s
                      ),
                    }
                  : e
              ),
            }
          : d
      ),
    }));
  };

  const diaActivo = rutina.dias[activeDiaIndex] ?? null;
  const indiceDiaActivo = diaActivo ? rutina.dias.findIndex((d) => d.id_temp === diaActivo.id_temp) : -1;
  const puedeSubirDiaEnRutina = indiceDiaActivo > 0;
  const puedeBajarDiaEnRutina =
    indiceDiaActivo >= 0 && indiceDiaActivo < rutina.dias.length - 1;

  if (isCargandoEdicion) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-white mt-4 font-bold text-lg">Cargando rutina…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <View className="px-4 pt-3 pb-2 border-b border-slate-800/80">
        <Text className="text-slate-500 mb-1.5 font-bold uppercase text-[10px] tracking-wide">
          {rutinaIdEditando ? "Editar rutina" : "Nueva rutina"}
        </Text>
        <TextInput
          className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 text-base font-semibold"
          placeholder="Nombre de la rutina"
          placeholderTextColor="#64748b"
          value={rutina.nombre}
          onChangeText={(txt) => setRutina((prev) => ({ ...prev, nombre: txt }))}
        />
      </View>

      {rutina.dias.length > 0 ? (
        <View className="border-b border-slate-800 bg-slate-900">
          <Text className="text-slate-600 text-[10px] font-bold uppercase px-4 pt-2 pb-1">Días (pestañas)</Text>
          <Text className="text-slate-600 text-[10px] px-4 pb-2 leading-4">
            El orden de las pestañas es el de la rutina (Día 1, Día 2…). Pulsa ↑ o ↓ junto al nombre del día para moverlo: el número de orden dentro del campo se actualiza al instante.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: 10,
              paddingTop: 4,
              alignItems: "center",
              gap: 8,
            }}
          >
            {rutina.dias.map((dia, i) => {
              const active = i === activeDiaIndex;
              const n = i + 1;
              return (
                <Pressable
                  key={dia.id_temp}
                  onPress={() => setActiveDiaIndex(i)}
                  className={`w-[72px] py-2.5 rounded-xl border items-center justify-center min-h-[48px] ${
                    active
                      ? "bg-blue-600 border-blue-500"
                      : "bg-slate-800 border-slate-700 active:bg-slate-700"
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-bold tabular-nums ${active ? "text-white" : "text-slate-300"}`}
                  >
                    Día {n}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={agregarDia}
              className="w-[72px] py-2.5 rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/50 items-center justify-center min-h-[48px]"
            >
              <Text className="text-blue-400 font-bold text-xl leading-none">+</Text>
              <Text className="text-slate-500 text-[10px] font-semibold mt-0.5">Nuevo</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      >
        {!diaActivo ? (
          <View className="py-16 px-4 items-center">
            <Text className="text-slate-500 text-center mb-4">No hay días en esta rutina.</Text>
            <TouchableOpacity className="py-3 px-6 bg-blue-600 rounded-xl" onPress={agregarDia}>
              <Text className="text-white font-bold">Añadir primer día</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-6">
            <View className="mb-5">
              <View className="flex-row items-start gap-2">
                <View className="w-[76px] items-center pt-1">
                  <Pressable
                    onPress={() => moverDiaEnRutina(diaActivo.id_temp, -1)}
                    disabled={!puedeSubirDiaEnRutina}
                    className={`p-2 rounded-lg ${puedeSubirDiaEnRutina ? "active:bg-slate-800" : "opacity-25"}`}
                    accessibilityLabel="Subir día en la rutina"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-up" size={22} color="#94a3b8" />
                  </Pressable>
                  <Pressable
                    onPress={() => moverDiaEnRutina(diaActivo.id_temp, 1)}
                    disabled={!puedeBajarDiaEnRutina}
                    className={`p-2 rounded-lg ${puedeBajarDiaEnRutina ? "active:bg-slate-800" : "opacity-25"}`}
                    accessibilityLabel="Bajar día en la rutina"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-down" size={22} color="#94a3b8" />
                  </Pressable>
                  <Text className="text-[9px] text-slate-500 text-center leading-3 mt-1 px-0.5">
                    Pulsa ↑ o ↓ para subir o bajar este día en la rutina.
                  </Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Nombre del día</Text>
                  <View className="flex-row rounded-xl border border-slate-700 bg-slate-800/90 overflow-hidden min-h-[52px]">
                    <View className="justify-center px-3 py-2 bg-slate-900/85 border-r border-slate-700 min-w-[72px]">
                      <Text className="text-slate-500 text-[9px] font-bold uppercase">Orden</Text>
                      <Text className="text-blue-400 font-bold text-xl tabular-nums leading-tight">
                        Día {indiceDiaActivo + 1}
                      </Text>
                      <Text className="text-slate-600 text-[9px] mt-0.5">de {rutina.dias.length}</Text>
                    </View>
                    <TextInput
                      className="flex-1 text-white text-lg font-semibold px-3 py-2 min-h-[52px]"
                      value={diaActivo.nombre}
                      onChangeText={(txt) =>
                        setRutina((prev) => ({
                          ...prev,
                          dias: prev.dias.map((d) =>
                            d.id_temp === diaActivo.id_temp ? { ...d, nombre: txt } : d
                          ),
                        }))
                      }
                      placeholder="Ej: Tren superior"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <Text className="text-[10px] text-slate-600 mt-1.5 leading-4">
                    El número «Día N» indica la posición en la rutina; cambia al reordenar con las flechas.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setModalEliminarDia({ diaId: diaActivo.id_temp, diaNombre: diaActivo.nombre })
                  }
                  className="mt-6 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-500/35 shrink-0"
                >
                  <Text className="text-red-400 font-semibold text-sm">Eliminar día</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Ejercicios</Text>
            <Text className="text-slate-600 text-[10px] mb-3 leading-4">
              En cada tarjeta, pulsa ↑ o ↓ para mover ese ejercicio arriba o abajo en este día. El número «Ejercicio N» se actualiza al reordenar; el entreno seguirá esa secuencia.
            </Text>

            {diaActivo.ejercicios.map((ej, ejIndex) => {
              const totalEj = diaActivo.ejercicios.length;
              const puedeSubir = ejIndex > 0;
              const puedeBajar = ejIndex < totalEj - 1;
              return (
              <View
                key={ej.id_temp}
                className="bg-slate-800/80 rounded-2xl mb-4 border border-slate-700/90 overflow-hidden"
              >
                <View className="flex-row items-center px-2 py-2 border-b border-slate-700/80 bg-slate-800">
                  <View className="mr-1">
                    <Pressable
                      onPress={() => moverEjercicioEnDia(diaActivo.id_temp, ej.id_temp, -1)}
                      disabled={!puedeSubir}
                      className={`p-2 rounded-lg ${puedeSubir ? "active:bg-slate-700" : "opacity-25"}`}
                      accessibilityLabel="Subir ejercicio"
                      accessibilityRole="button"
                    >
                      <Ionicons name="chevron-up" size={22} color="#94a3b8" />
                    </Pressable>
                    <Pressable
                      onPress={() => moverEjercicioEnDia(diaActivo.id_temp, ej.id_temp, 1)}
                      disabled={!puedeBajar}
                      className={`p-2 rounded-lg ${puedeBajar ? "active:bg-slate-700" : "opacity-25"}`}
                      accessibilityLabel="Bajar ejercicio"
                      accessibilityRole="button"
                    >
                      <Ionicons name="chevron-down" size={22} color="#94a3b8" />
                    </Pressable>
                  </View>
                  <TouchableOpacity
                    className="flex-1 pr-2 py-1"
                    onPress={() => {
                      setSlotSeleccionado({ diaId: diaActivo.id_temp, ejId: ej.id_temp });
                      setModalVisible(true);
                    }}
                  >
                    <Text className="text-slate-500 text-xs">Ejercicio {ejIndex + 1}</Text>
                    <Text
                      className={
                        ej.ejercicio_nombre
                          ? "text-white font-bold text-base mt-0.5"
                          : "text-blue-400 text-base mt-0.5"
                      }
                    >
                      {ej.ejercicio_nombre || "Elegir ejercicio…"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setModalEliminarEjercicio({
                        diaId: diaActivo.id_temp,
                        ejId: ej.id_temp,
                        ejNombre: ej.ejercicio_nombre,
                      })
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="px-2 py-2"
                  >
                    <Text className="text-slate-500 font-bold text-lg">×</Text>
                  </TouchableOpacity>
                </View>

                <View className="p-3">
                  <View className="flex-row mb-2 px-1">
                    <Text className="w-10 text-slate-500 text-[10px] font-bold text-center">#</Text>
                    <Text className="flex-1 text-slate-500 text-[10px] font-bold text-center">Reps</Text>
                    <Text className="flex-1 text-slate-500 text-[10px] font-bold text-center">Kg</Text>
                    <View className="w-8" />
                  </View>

                  {ej.series.map((serie, index) => (
                    <View key={serie.id_temp} className="flex-row items-center mb-2">
                      <View className="w-10 h-9 bg-slate-900/80 rounded-lg items-center justify-center mr-1">
                        <Text className="text-slate-400 text-sm font-bold">{index + 1}</Text>
                      </View>
                      <TextInput
                        className="flex-1 mx-1 bg-slate-900/60 text-white py-2 rounded-lg text-center text-sm border border-slate-700/80"
                        keyboardType="numeric"
                        selectTextOnFocus
                        value={serie.reps_objetivo?.toString()}
                        onChangeText={(txt) =>
                          actualizarSerie(diaActivo.id_temp, ej.id_temp, serie.id_temp, "reps_objetivo", txt)
                        }
                      />
                      <TextInput
                        className="flex-1 mx-1 bg-slate-900/60 text-white py-2 rounded-lg text-center text-sm border border-slate-700/80"
                        keyboardType="numeric"
                        selectTextOnFocus
                        value={serie.peso_objetivo?.toString()}
                        onChangeText={(txt) =>
                          actualizarSerie(diaActivo.id_temp, ej.id_temp, serie.id_temp, "peso_objetivo", txt)
                        }
                      />
                      <TouchableOpacity
                        className="w-8 h-9 items-center justify-center"
                        onPress={() => eliminarSerie(diaActivo.id_temp, ej.id_temp, serie.id_temp)}
                      >
                        <Text className="text-slate-600 text-lg">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => agregarSerie(diaActivo.id_temp, ej.id_temp)}
                    className="mt-1 py-2.5 rounded-xl bg-slate-900/40 border border-slate-700/60 border-dashed"
                  >
                    <Text className="text-blue-400 text-center font-semibold text-sm">+ Serie</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
            })}

            <TouchableOpacity
              className="py-3.5 rounded-xl items-center border border-dashed border-slate-600 bg-slate-800/40"
              onPress={() => agregarHuecoEjercicio(diaActivo.id_temp)}
            >
              <Text className="text-slate-300 font-semibold">+ Añadir ejercicio al día</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {rutina.dias.length === 0 ? (
        <View className="px-4 pb-2">
          <TouchableOpacity className="py-3 bg-blue-600 rounded-xl items-center" onPress={agregarDia}>
            <Text className="text-white font-bold">+ Añadir día de entreno</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="bg-slate-900 border-t border-slate-800 px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <TouchableOpacity
          className={`py-3.5 rounded-xl items-center ${isLoading ? "bg-emerald-800" : "bg-emerald-600"}`}
          onPress={validarYGuardar}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              {rutinaIdEditando ? "Actualizar rutina" : "Guardar rutina"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalSalirSinGuardar}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalSalirSinGuardar(false);
          pendingLeaveActionRef.current = null;
        }}
      >
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">¿Salir sin guardar?</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-6">
              Tienes cambios que no se han guardado. Si vuelves atrás, se perderán.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-slate-700"
                onPress={() => {
                  setModalSalirSinGuardar(false);
                  pendingLeaveActionRef.current = null;
                }}
              >
                <Text className="text-slate-200 text-center font-semibold">Seguir editando</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-amber-600"
                onPress={confirmarSalirSinGuardar}
              >
                <Text className="text-slate-900 text-center font-bold">Salir sin guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalEliminarDia != null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminarDia(null)}
      >
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">Eliminar día</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-6">
              ¿Eliminar «{modalEliminarDia?.diaNombre ?? ""}» y todos sus ejercicios? Esta acción no se puede deshacer.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-slate-700"
                onPress={() => setModalEliminarDia(null)}
              >
                <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 py-3 rounded-xl bg-red-700" onPress={ejecutarEliminarDia}>
                <Text className="text-white text-center font-bold">Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalEliminarEjercicio != null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminarEjercicio(null)}
      >
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
            <Text className="text-white text-xl font-bold mb-2">Eliminar ejercicio</Text>
            <Text className="text-slate-400 text-sm leading-5 mb-6">
              ¿Quitar{" "}
              {modalEliminarEjercicio?.ejNombre
                ? `«${modalEliminarEjercicio.ejNombre}»`
                : "este hueco"}{" "}
              del día?
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-slate-700"
                onPress={() => setModalEliminarEjercicio(null)}
              >
                <Text className="text-slate-200 text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-red-700"
                onPress={ejecutarEliminarEjercicio}
              >
                <Text className="text-white text-center font-bold">Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppDialog
        visible={dialogoApp != null}
        title={dialogoApp?.title ?? ""}
        message={dialogoApp?.message ?? ""}
        onRequestClose={() => setDialogoApp(null)}
        actions={dialogoApp?.actions ?? []}
      />

      <ExerciseSelectorModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSlotSeleccionado(null);
        }}
        onSelect={manejarSeleccionEjercicio}
      />
    </View>
  );
}
