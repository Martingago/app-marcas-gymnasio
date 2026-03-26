import "./global.css";
import React, { useEffect, useState } from "react";
import { Platform, ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { initDB } from "./src/database";
import { RootStackParamList } from "./src/navigation/types";
import HomeScreen from "@/navigation/HomeScreen";
import ExercisesScreen from "@/navigation/ExercisesScreen";
import HistoryScreen from "@/navigation/HistoryScreen";
import ActiveWorkoutScreen from "@/navigation/ActiveWorkoutScreen";
import CreateRoutineScreen from "@/screens/CreateRoutineScreen";
import RoutinesScreen from "@/screens/RoutinesScreen";

// Importación de pantallas

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      if (Platform.OS !== "web") {
        await initDB();
      }
      setIsDbReady(true);
    };
    setup();
  }, []);

  if (!isDbReady) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" }, // slate-900
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      >
        <Stack.Screen
          name="CreateRoutine"
          component={CreateRoutineScreen}
          options={{ title: "Crear Rutina Nueva" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Routines"
          component={RoutinesScreen}
          options={{ title: "Mis Rutinas" }}
        />
        <Stack.Screen
          name="Exercises"
          component={ExercisesScreen}
          options={{ title: "Ejercicios" }}
        />
        <Stack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{ title: "Entrenando" }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "Evolución" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
