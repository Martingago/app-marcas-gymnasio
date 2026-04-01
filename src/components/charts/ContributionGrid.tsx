import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatoFechaDMY, formatoFechaTituloExtendido } from "@/lib/fechaFormato";
import type { SesionRutinaResumen } from "@/services/entrenamientos/entrenamientosService";

const GAP = 2;
const WEEKS = 18;
const LABEL_COL = 28;
const LABEL_MARGIN = 4;
/** Celdas nunca más pequeñas que esto (px); si no caben, la cuadrícula hace scroll horizontal */
const MIN_CELL_SIZE = 12;

const COL_EMPTY = "#1e293b";
const COL_L1 = "#064e3b";
const COL_L2 = "#047857";
const COL_L3 = "#22c55e";
/** Contorno del día seleccionado en la cuadrícula */
const OUTLINE_SELECTED = "#e2e8f0";
const OUTLINE_WIDTH = 2;

type Props = {
  fechasConEntreno: string[];
  sesiones: SesionRutinaResumen[];
  onAbrirSesion: (entrenamientoId: number) => void;
  /** Textos del modal cuando se muestran entrenos de todas las rutinas */
  vistaGlobal?: boolean;
  /** Sustituye el texto bajo el título del calendario (p. ej. vista ejercicio) */
  descripcionCalendario?: string;
  /** Modal: día sin sesiones en la lista (si no se pasa, se usa el mensaje de rutina/global) */
  textoSinSesionesEnDia?: string;
  /** Modal: sufijo tras «N entreno(s)» (p. ej. « con este ejercicio»). Si no se pasa, depende de vistaGlobal */
  sufijoLineaConteoSesiones?: string;
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

function colorHex(count: number): string {
  if (count <= 0) return COL_EMPTY;
  if (count === 1) return COL_L1;
  if (count === 2) return COL_L2;
  return COL_L3;
}

/** Ancho útil para la cuadrícula (solo columnas de días), 1:1, ocupando todo `gridAvail` si cabe */
function computeCellAndGridWidth(gridAvail: number): { cellSize: number; gridWidth: number; needsScroll: boolean } {
  const gapsTotal = (WEEKS - 1) * GAP;
  const idealCell = (gridAvail - gapsTotal) / WEEKS;

  if (idealCell >= MIN_CELL_SIZE) {
    const cellSize = idealCell;
    const gridWidth = WEEKS * cellSize + gapsTotal;
    return { cellSize, gridWidth, needsScroll: false };
  }

  const cellSize = MIN_CELL_SIZE;
  const gridWidth = WEEKS * cellSize + gapsTotal;
  return { cellSize, gridWidth, needsScroll: gridWidth > gridAvail + 0.5 };
}

export default function ContributionGrid({
  fechasConEntreno,
  sesiones,
  onAbrirSesion,
  vistaGlobal = false,
  descripcionCalendario,
  textoSinSesionesEnDia,
  sufijoLineaConteoSesiones,
}: Props) {
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measuredW, setMeasuredW] = useState(0);

  const onRootLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setMeasuredW((prev) => (Math.abs(prev - w) < 0.5 ? prev : w));
    }
  }, []);

  const usableWidth = measuredW > 8 ? measuredW : Math.max(240, screenW - 32);
  const gridAvail = Math.max(0, usableWidth - LABEL_COL - LABEL_MARGIN);

  const { cellSize, gridWidth, needsScroll } = useMemo(
    () => computeCellAndGridWidth(gridAvail),
    [gridAvail],
  );

  const gridHeight = 7 * cellSize + 6 * GAP;

  const sesionesPorFecha = useMemo(() => {
    const m = new Map<string, SesionRutinaResumen[]>();
    for (const s of sesiones) {
      const arr = m.get(s.fecha) ?? [];
      arr.push(s);
      m.set(s.fecha, arr);
    }
    return m;
  }, [sesiones]);

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

  /** Día con contorno (persiste al cerrar el panel). */
  const [diaResaltado, setDiaResaltado] = useState<string | null>(null);
  /** Día cuyo panel está abierto; null = modal cerrado. */
  const [diaModalAbierto, setDiaModalAbierto] = useState<string | null>(null);

  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
  const legendSize = Math.max(MIN_CELL_SIZE, Math.min(14, Math.round(cellSize * 0.65)));

  const listaDiaSeleccionado = diaModalAbierto ? sesionesPorFecha.get(diaModalAbierto) ?? [] : [];

  const gridBody = (
    <View className="flex-row" style={{ width: gridWidth, gap: GAP }}>
      {grid.map((weekCol, wi) => (
        <View key={wi} style={{ gap: GAP }}>
          {weekCol.map((cell) => {
            const selected = diaResaltado === cell.day;
            return (
              <Pressable
                key={cell.day}
                onPress={() => {
                  setDiaResaltado(cell.day);
                  setDiaModalAbierto(cell.day);
                }}
                hitSlop={cellSize < 16 ? { top: 6, bottom: 6, left: 2, right: 2 } : undefined}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={`${cell.day}, ${cell.count} entreno(s)`}
                accessibilityState={{ selected }}
              >
                <View
                  collapsable={false}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    minWidth: MIN_CELL_SIZE,
                    minHeight: MIN_CELL_SIZE,
                    borderRadius: 4,
                    backgroundColor: colorHex(cell.count),
                    borderWidth: selected ? OUTLINE_WIDTH : 0,
                    borderColor: OUTLINE_SELECTED,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ alignSelf: "stretch" }} onLayout={onRootLayout}>
      <Text className="text-slate-500 text-xs mb-3">
        {descripcionCalendario ??
          `Últimas ${WEEKS} semanas · Toca un día para ver el detalle`}
      </Text>

      <View className="flex-row items-start" style={{ alignSelf: "stretch" }}>
        <View style={{ width: LABEL_COL, height: gridHeight, marginRight: LABEL_MARGIN, gap: GAP }}>
          {diasSemana.map((d, i) => (
            <View key={i} style={{ height: cellSize, minHeight: MIN_CELL_SIZE, justifyContent: "center" }} className="pr-1">
              <Text className="text-slate-600 text-[10px] text-right">{d}</Text>
            </View>
          ))}
        </View>

        {needsScroll ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 1, maxWidth: gridAvail }}
            contentContainerStyle={{ flexGrow: 0 }}
          >
            {gridBody}
          </ScrollView>
        ) : (
          <View style={{ width: gridWidth, flexShrink: 0 }}>{gridBody}</View>
        )}
      </View>

      <View className="flex-row items-center gap-3 mt-4 flex-wrap">
        <Text className="text-slate-600 text-xs">Menos</Text>
        <View className="flex-row" style={{ gap: 4 }}>
          <View className="rounded-sm" style={{ width: legendSize, height: legendSize, backgroundColor: COL_EMPTY }} />
          <View className="rounded-sm" style={{ width: legendSize, height: legendSize, backgroundColor: COL_L1 }} />
          <View className="rounded-sm" style={{ width: legendSize, height: legendSize, backgroundColor: COL_L2 }} />
          <View className="rounded-sm" style={{ width: legendSize, height: legendSize, backgroundColor: COL_L3 }} />
        </View>
        <Text className="text-slate-600 text-xs">Más entrenos ese día</Text>
      </View>

      <Modal
        visible={diaModalAbierto != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDiaModalAbierto(null)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => setDiaModalAbierto(null)} />
          <View className="bg-slate-800 rounded-t-3xl border border-slate-600 border-b-0" style={{ maxHeight: "85%" }}>
            <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-2" />
            <ScrollView
              className="px-5 pt-2"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Día</Text>
              <Text className="text-white text-xl font-bold mb-1">
                {diaModalAbierto ? formatoFechaTituloExtendido(diaModalAbierto) : ""}
              </Text>
              <Text className="text-slate-500 text-sm mb-5">
                {diaModalAbierto ? formatoFechaDMY(diaModalAbierto) : ""}
              </Text>

              {listaDiaSeleccionado.length === 0 ? (
                <Text className="text-slate-500 text-base leading-6">
                  {textoSinSesionesEnDia ??
                    (vistaGlobal
                      ? "No hay entrenos registrados en esta fecha."
                      : "No hay entrenos registrados con esta rutina en esta fecha (día de descanso o entreno con otra rutina).")}
                </Text>
              ) : (
                <>
                  <Text className="text-slate-400 text-sm mb-3">
                    {listaDiaSeleccionado.length} entreno{listaDiaSeleccionado.length === 1 ? "" : "s"}
                    {sufijoLineaConteoSesiones != null
                      ? sufijoLineaConteoSesiones
                      : vistaGlobal
                        ? ""
                        : " con esta rutina"}
                  </Text>
                  {listaDiaSeleccionado.map((s) => (
                    <TouchableOpacity
                      key={s.entrenamientoId}
                      className="bg-slate-900/80 rounded-xl p-4 mb-3 border border-slate-700"
                      onPress={() => {
                        setDiaModalAbierto(null);
                        onAbrirSesion(s.entrenamientoId);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text className="text-emerald-400 font-semibold">{s.rutinaNombre}</Text>
                      <Text className="text-white font-bold mt-1">{s.diaNombre ?? "Día de rutina"}</Text>
                      <Text className="text-blue-400 text-sm mt-2">Ver detalle del entreno ›</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <TouchableOpacity
                className="mt-4 py-3 rounded-xl bg-slate-700"
                onPress={() => setDiaModalAbierto(null)}
              >
                <Text className="text-slate-200 text-center font-semibold">Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
