import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import type { Categoria } from "@/interfaces/categoria";

type Props = {
  categorias: Categoria[];
  categoriaActiva: number | null;
  onChange: (id: number | null) => void;
};

/**
 * Fila 1: solo categorías raíz (+ Todas). Fila 2: hijos del grupo activo (p. ej. Brazo → bíceps, tríceps…).
 * Si el filtro es una hija, la raíz correspondiente sigue marcada en la fila 1.
 */
export function ExerciseCategoryFilterBar({ categorias, categoriaActiva, onChange }: Props) {
  const { raices, hijosPorPadre } = useMemo(() => {
    const raices = categorias.filter((c) => c.parentId == null);
    const hijosPorPadre = new Map<number, Categoria[]>();
    for (const c of categorias) {
      if (c.parentId == null) continue;
      const pid = c.parentId;
      if (!hijosPorPadre.has(pid)) hijosPorPadre.set(pid, []);
      hijosPorPadre.get(pid)!.push(c);
    }
    for (const arr of hijosPorPadre.values()) {
      arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    return { raices, hijosPorPadre };
  }, [categorias]);

  const grupoRaizId = useMemo(() => {
    if (categoriaActiva == null) return null;
    const cat = categorias.find((c) => c.id === categoriaActiva);
    if (!cat) return null;
    return cat.parentId ?? cat.id;
  }, [categoriaActiva, categorias]);

  const hijosDelGrupo =
    grupoRaizId != null ? (hijosPorPadre.get(grupoRaizId) ?? []) : [];
  const mostrarFilaHijos = hijosDelGrupo.length > 0;

  return (
    <View className="gap-2">
      <Text className="text-slate-600 text-[10px] font-bold uppercase">Grupo muscular</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingBottom: 4 }}
      >
        <Pressable
          onPress={() => onChange(null)}
          className={`px-3.5 py-2 rounded-xl border ${
            categoriaActiva === null ? "bg-blue-600 border-blue-500" : "bg-slate-800 border-slate-700 active:opacity-90"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${categoriaActiva === null ? "text-white" : "text-slate-300"}`}
            numberOfLines={1}
          >
            Todas
          </Text>
        </Pressable>
        {raices.map((c) => {
          const active = grupoRaizId === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => onChange(c.id)}
              className={`px-3.5 py-2 rounded-xl border max-w-[200px] ${
                active ? "bg-blue-600 border-blue-500" : "bg-slate-800 border-slate-700 active:opacity-90"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}
                numberOfLines={1}
              >
                {c.nombre}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {mostrarFilaHijos ? (
        <View className="pt-1">
          <Text className="text-slate-600 text-[10px] font-bold uppercase mb-1.5">Afinar zona</Text>
          <Text className="text-slate-500 text-[10px] mb-1.5 leading-4">
            Toca una subcategoría o deja solo el grupo para ver todo (p. ej. todo el brazo).
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {hijosDelGrupo.map((h) => {
              const active = categoriaActiva === h.id;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => onChange(h.id)}
                  className={`px-3.5 py-2 rounded-xl border max-w-[160px] ${
                    active
                      ? "bg-violet-600 border-violet-400"
                      : "bg-slate-800/90 border-slate-600 border-l-2 border-l-violet-500/50 active:opacity-90"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}
                    numberOfLines={1}
                  >
                    {h.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
