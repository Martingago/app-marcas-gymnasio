import React from "react";
import { FlatList, View, Text } from "react-native";
import { Ejercicio } from "@/interfaces/ejercicio";
import ExerciseItem from "./ExerciseItem";

interface Props {
  ejercicios: Ejercicio[];
  onExercisePress?: (ejercicio: Ejercicio) => void;
  onOptionsPress?: (ejercicio: Ejercicio) => void; // Prop añadida
}

export default function ExerciseList({
  ejercicios,
  onExercisePress,
  onOptionsPress,
}: Props) {
  // Renderizado cuando la lista está vacía
  if (ejercicios.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <Text className="text-slate-400 text-lg">
          No hay ejercicios para mostrar.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={ejercicios}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ExerciseItem
          ejercicio={item}
          onPress={onExercisePress}
          onOptionsPress={onOptionsPress} // Pasamos el evento hacia arriba
        />
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
