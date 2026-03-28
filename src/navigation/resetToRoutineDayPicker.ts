import { CommonActions } from "@react-navigation/native";

import type { RootStackParamList } from "@/navigation/types";

type NavLike = {
  getState: () => { routes: { name: string; params?: object }[] };
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
};

/**
 * Quita WorkoutSession, RoutineDayPreview y cualquier pantalla por encima de RoutineDayPicker
 * del stack y deja el picker como pantalla actual. Así el botón atrás no vuelve al entreno.
 */
export function resetStackToRoutineDayPicker(
  navigation: NavLike,
  rutinaId: number,
  nombreRutina: string
): void {
  const state = navigation.getState();
  const idxPicker = state.routes.findIndex((r) => r.name === "RoutineDayPicker");

  if (idxPicker < 0) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "RoutineDayPicker", params: { rutinaId, nombreRutina } }],
      })
    );
    return;
  }

  const routes = state.routes.slice(0, idxPicker + 1).map((r) => {
    if (r.name === "RoutineDayPicker") {
      return { name: "RoutineDayPicker" as const, params: { rutinaId, nombreRutina } };
    }
    return {
      name: r.name as keyof RootStackParamList,
      params: r.params as RootStackParamList[keyof RootStackParamList] | undefined,
    };
  });

  navigation.dispatch(
    CommonActions.reset({
      index: routes.length - 1,
      routes,
    })
  );
}
