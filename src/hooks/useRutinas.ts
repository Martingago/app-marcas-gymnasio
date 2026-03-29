// src/hooks/useRutinas.ts
import { useState } from "react";
import { editarRutinaCompleta, guardarRutinaCompleta } from "@/services/rutina/rutinasService";
import { FormRutina } from "@/interfaces/form/formRutina";

export type GuardarRutinaOptions = {
  onSuccess?: () => void;
  /** Tras persistir en BD (antes de que el usuario pulse OK en el modal de la pantalla) */
  onSaved?: () => void;
  onError?: (message: string) => void;
};

export const useRutinas = () => {
  const [isLoading, setIsLoading] = useState(false);

  const crearRutina = async (
    rutina: FormRutina,
    options?: { onSaved?: () => void; onError?: (message: string) => void }
  ) => {
    if (!rutina.nombre.trim()) {
      options?.onError?.("Por favor, introduce un nombre para la rutina.");
      return;
    }

    setIsLoading(true);
    try {
      await guardarRutinaCompleta(rutina);
      options?.onSaved?.();
    } catch (error) {
      console.error(error);
      options?.onError?.("No se pudo crear la rutina. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const guardarOEditarRutina = async (
    rutina: FormRutina,
    rutinaIdEditando?: number,
    options?: GuardarRutinaOptions
  ) => {
    setIsLoading(true);
    try {
      if (rutinaIdEditando) {
        await editarRutinaCompleta(rutinaIdEditando, rutina);
      } else {
        await guardarRutinaCompleta(rutina);
      }
      options?.onSuccess?.();
      options?.onSaved?.();
    } catch (error) {
      console.error(error);
      options?.onError?.("No se pudo guardar la rutina.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    crearRutina,
    guardarOEditarRutina,
    isLoading,
  };
};
