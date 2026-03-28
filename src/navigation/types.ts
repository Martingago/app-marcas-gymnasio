export type RootStackParamList = {
  Home: undefined;
  Routines: undefined;
  CreateRoutine: { rutinaId?: number } | undefined;
  Exercises: undefined;
  ExerciseDetail: { ejercicioId: number };
  ActiveWorkout: undefined;
  RoutineDayPicker: { rutinaId: number; nombreRutina: string };
  WorkoutSession: {
    rutinaId: number;
    rutinaDiaId: number;
    nombreRutina: string;
    nombreDia: string;
  };
  RoutineHistory: { rutinaId: number; nombreRutina: string };
  SessionDetail: { entrenamientoId: number };
  History: undefined;
};