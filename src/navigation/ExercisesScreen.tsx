import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Exercises'>;

export default function ExercisesScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-slate-900 p-6 justify-center">
      <Text className="text-white text-4xl font-bold mb-8 text-center">Mi Gym App</Text>
      
      <View className="space-y-4">
        <TouchableOpacity 
          className="bg-blue-600 p-6 rounded-2xl shadow-lg"
          onPress={() => navigation.navigate('Routines')}
        >
          <Text className="text-white text-xl font-semibold text-center">🚀 Empezar Entreno</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-slate-800 p-5 rounded-2xl border border-slate-700"
          onPress={() => navigation.navigate('Exercises')}
        >
          <Text className="text-slate-300 text-lg text-center">📚 Mis Ejercicios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-slate-800 p-5 rounded-2xl border border-slate-700"
          onPress={() => navigation.navigate('History')}
        >
          <Text className="text-slate-300 text-lg text-center">📈 Historial y Evolución</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}