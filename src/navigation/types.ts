export type RootStackParamList = {
  Home: undefined;
  Routines: undefined;
  Exercises: undefined;
  ActiveWorkout: { rutinaId: number; nombreRutina: string }; // Para empezar a entrenar
  History: undefined;
};