export type RootStackParamList = {
  Home: undefined;
  Routines: undefined;
  CreateRoutine: { rutinaId?: number } | undefined;
  Exercises: undefined;
  ExerciseDetail: { ejercicioId: number };
  ActiveWorkout: undefined;
  /** `vistaInformacionRutina`: desde Mis rutinas (detalle sin forzar flujo de «elegir día para entrenar»). */
  RoutineDayPicker: {
    rutinaId: number;
    nombreRutina: string;
    vistaInformacionRutina?: boolean;
  };
  /** Vista previa del día (sin crear sesión de entreno) */
  RoutineDayPreview: {
    rutinaId: number;
    rutinaDiaId: number;
    nombreRutina: string;
    nombreDia: string;
  };
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