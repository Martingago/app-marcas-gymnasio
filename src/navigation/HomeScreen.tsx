import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-slate-900">
      <View className="flex-1 px-6 justify-center">
        <Text className="text-white text-4xl font-bold mb-2 text-center">NextPR</Text>
        <Text className="text-slate-500 text-center text-sm mb-10">Rutinas, entrenos y seguimiento</Text>

        <View className="gap-5">
          <TouchableOpacity
            className="bg-blue-600 py-5 px-6 rounded-2xl shadow-lg"
            onPress={() => navigation.navigate("Routines")}
            activeOpacity={0.85}
          >
            <Text className="text-white text-xl font-semibold text-center">Empezar entreno</Text>
            <Text className="text-blue-100/90 text-sm text-center mt-1">Elegir rutina y día</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-800 py-5 px-6 rounded-2xl border border-slate-700"
            onPress={() => navigation.navigate("Exercises")}
            activeOpacity={0.85}
          >
            <Text className="text-slate-200 text-lg font-semibold text-center">Mis ejercicios</Text>
            <Text className="text-slate-500 text-sm text-center mt-1">Catálogo y detalle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-800 py-5 px-6 rounded-2xl border border-slate-700"
            onPress={() => navigation.navigate("History")}
            activeOpacity={0.85}
          >
            <Text className="text-slate-200 text-lg font-semibold text-center">Historial y evolución</Text>
            <Text className="text-slate-500 text-sm text-center mt-1">Lista, calendario y progreso global</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
