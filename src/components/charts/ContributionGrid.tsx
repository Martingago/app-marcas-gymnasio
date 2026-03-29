import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";

const CELL = 11;
const GAP = 3;
const WEEKS = 18;

type Props = {
  /** Fechas ISO yyyy-mm-dd con al menos un entreno */
  fechasConEntreno: string[];
};

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Intensidad 0–3 según entrenos ese día (misma rutina puede tener varios en teoría) */
export default function ContributionGrid({ fechasConEntreno }: Props) {
  const grid = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of fechasConEntreno) {
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endWeek = startOfWeekMonday(today);
    const startWeek = addDays(endWeek, -(WEEKS - 1) * 7);

    const weeks: { day: string; count: number }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col: { day: string; count: number }[] = [];
      for (let dow = 0; dow < 7; dow++) {
        const cellDate = addDays(startWeek, w * 7 + dow);
        const iso = toIso(cellDate);
        col.push({ day: iso, count: counts.get(iso) ?? 0 });
      }
      weeks.push(col);
    }

    return weeks;
  }, [fechasConEntreno]);

  const colorFor = (c: number) => {
    if (c <= 0) return "bg-slate-800";
    if (c === 1) return "bg-emerald-900";
    if (c === 2) return "bg-emerald-700";
    return "bg-emerald-500";
  };

  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <View>
      <Text className="text-slate-500 text-xs mb-3">
        Últimas semanas (cada cuadro es un día; verde = entreno con esta rutina)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-[3px]">
          <View className="justify-between mr-1" style={{ height: 7 * (CELL + GAP) - GAP }}>
            {diasSemana.map((d, i) => (
              <Text key={i} className="text-slate-600 text-[9px]" style={{ lineHeight: CELL + GAP }}>
                {d}
              </Text>
            ))}
          </View>
          {grid.map((weekCol, wi) => (
            <View key={wi} className="gap-[3px]">
              {weekCol.map((cell) => (
                <View
                  key={cell.day}
                  className={`rounded-sm ${colorFor(cell.count)}`}
                  style={{ width: CELL, height: CELL }}
                  accessibilityLabel={`${cell.day}: ${cell.count} entreno(s)`}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="flex-row items-center gap-3 mt-4">
        <Text className="text-slate-600 text-xs">Menos</Text>
        <View className="flex-row gap-1">
          <View className="rounded-sm bg-slate-800" style={{ width: CELL, height: CELL }} />
          <View className="rounded-sm bg-emerald-900" style={{ width: CELL, height: CELL }} />
          <View className="rounded-sm bg-emerald-700" style={{ width: CELL, height: CELL }} />
          <View className="rounded-sm bg-emerald-500" style={{ width: CELL, height: CELL }} />
        </View>
        <Text className="text-slate-600 text-xs">Más</Text>
      </View>
    </View>
  );
}
