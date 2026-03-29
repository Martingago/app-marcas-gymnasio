import React, { useMemo } from "react";
import { SectionList, View, Text } from "react-native";
import { Ejercicio } from "@/interfaces/ejercicio";
import ExerciseItem from "./ExerciseItem";

interface Props {
  ejercicios: Ejercicio[];
  onExercisePress?: (ejercicio: Ejercicio) => void;
  onOptionsPress?: (ejercicio: Ejercicio) => void;
  disableNavigation?: boolean;
  /** Agrupa por letra inicial para listas largas */
  alphabetSections?: boolean;
}

function buildAlphabetSections(items: Ejercicio[]): { title: string; data: Ejercicio[] }[] {
  const map = new Map<string, Ejercicio[]>();
  for (const e of items) {
    const raw = e.nombre.trim().charAt(0);
    const upper = raw.toLocaleUpperCase("es");
    const isLetterOrDigit = /[A-ZÁÉÍÓÚÜÑ0-9]/i.test(raw);
    const key = isLetterOrDigit ? upper : "#";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  const titles = [...map.keys()].sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b, "es");
  });
  return titles.map((title) => ({ title, data: map.get(title)! }));
}

export default function ExerciseList({
  ejercicios,
  onExercisePress,
  onOptionsPress,
  disableNavigation = false,
  alphabetSections = true,
}: Props) {
  const sections = useMemo(() => {
    if (!alphabetSections) return [{ title: "", data: ejercicios }] as { title: string; data: Ejercicio[] }[];
    return buildAlphabetSections(ejercicios);
  }, [ejercicios, alphabetSections]);

  if (ejercicios.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <Text className="text-slate-400 text-lg">No hay ejercicios para mostrar.</Text>
      </View>
    );
  }

  const showHeaders = alphabetSections;

  return (
    <SectionList
      style={{ flex: 1 }}
      sections={sections}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ExerciseItem
          ejercicio={item}
          onPress={onExercisePress}
          onOptionsPress={onOptionsPress}
          disableNavigation={disableNavigation}
        />
      )}
      renderSectionHeader={
        showHeaders
          ? ({ section: { title } }) => (
              <View className="bg-slate-900/95 pt-3 pb-1.5 border-b border-slate-800">
                <Text className="text-slate-500 text-xs font-bold tracking-wider">{title}</Text>
              </View>
            )
          : () => null
      }
      stickySectionHeadersEnabled={showHeaders}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}
