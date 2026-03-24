// src/hooks/useRutinas.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { guardarRutinaCompleta } from '@/services/rutina/rutinasService';
import { FormRutina } from '@/interfaces/form/formRutina';

export const useRutinas = (navigation: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const crearRutina = async (rutina: FormRutina) => {
    // Validación básica
    if (!rutina.nombre.trim()) {
      Alert.alert("Aviso", "Por favor, introduce un nombre para la rutina.");
      return;
    }

    setIsLoading(true);
    try {
      await guardarRutinaCompleta(rutina);
      Alert.alert("¡Éxito!", "Tu rutina ha sido creada correctamente",[
        { 
          text: "Ver Rutinas", 
          onPress: () => navigation.goBack() 
        }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear la rutina. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    crearRutina,
    isLoading
  };
};