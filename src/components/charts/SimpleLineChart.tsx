import React, { useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Polyline, Line, Circle, Text as SvgText, G } from "react-native-svg";

type Props = {
  values: number[];
  labels?: string[];
  height?: number;
  strokeColor?: string;
  yAxisLabel?: string;
  emptyText?: string;
};

const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

export default function SimpleLineChart({
  values,
  labels,
  height = 200,
  strokeColor = "#34d399",
  yAxisLabel,
  emptyText = "No hay datos suficientes para la gráfica.",
}: Props) {
  const width = Math.min(Dimensions.get("window").width - 32, 360);

  const { points, yTicks, minY, maxY, normLabels } = useMemo(() => {
    const n = values.length;
    if (n === 0) {
      return { points: "", yTicks: [] as number[], minY: 0, maxY: 1, normLabels: [] as string[] };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = max === min ? Math.max(min * 0.05, 1) : (max - min) * 0.08;
    const lo = min - pad;
    const hi = max + pad;
    const span = hi - lo || 1;
    const innerW = width - PAD_L - PAD_R;
    const innerH = height - PAD_T - PAD_B;
    const pts: string[] = [];
    values.forEach((v, i) => {
      const x = PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const yNorm = (v - lo) / span;
      const y = PAD_T + innerH * (1 - yNorm);
      pts.push(`${x},${y}`);
    });
    const ticks = 4;
    const yTicks: number[] = [];
    for (let t = 0; t <= ticks; t++) {
      yTicks.push(lo + (span * t) / ticks);
    }
    const normLabels =
      labels && labels.length === n ? labels : values.map((_, i) => `${i + 1}`);
    return { points: pts.join(" "), yTicks, minY: lo, maxY: hi, normLabels };
  }, [values, labels, width, height]);

  if (values.length === 0) {
    return (
      <View className="py-8 px-2 items-center">
        <Text className="text-slate-500 text-center text-sm">{emptyText}</Text>
      </View>
    );
  }

  if (values.length === 1) {
    return (
      <View className="py-4">
        <Text className="text-slate-400 text-xs mb-2">{yAxisLabel ?? "Valor"}</Text>
        <Text className="text-emerald-400 text-3xl font-bold">{values[0].toFixed(1)}</Text>
        <Text className="text-slate-500 text-xs mt-2">Solo hay una sesión; la línea necesita al menos dos puntos.</Text>
      </View>
    );
  }

  const innerW = width - PAD_L - PAD_R;
  const innerH = height - PAD_T - PAD_B;

  return (
    <View>
      {yAxisLabel ? (
        <Text className="text-slate-500 text-xs mb-1 ml-1">{yAxisLabel}</Text>
      ) : null}
      <Svg width={width} height={height}>
        {yTicks.map((tick, i) => {
          const yNorm = (tick - minY) / (maxY - minY || 1);
          const y = PAD_T + innerH * (1 - yNorm);
          return (
            <G key={i}>
              <Line
                x1={PAD_L}
                y1={y}
                x2={width - PAD_R}
                y2={y}
                stroke="#334155"
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
              <SvgText x={4} y={y + 4} fill="#64748b" fontSize="10">
                {tick.toFixed(0)}
              </SvgText>
            </G>
          );
        })}
        <Polyline points={points} fill="none" stroke={strokeColor} strokeWidth={2.5} />
        {values.map((v, i) => {
          const n = values.length;
          const x = PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
          const yNorm = (v - minY) / (maxY - minY || 1);
          const y = PAD_T + innerH * (1 - yNorm);
          return <Circle key={i} cx={x} cy={y} r={4} fill={strokeColor} stroke="#0f172a" strokeWidth={1} />;
        })}
      </Svg>
      <View className="flex-row justify-between mt-1 px-1" style={{ width, paddingLeft: PAD_L - 8 }}>
        {normLabels.map((lab, i) => (
          <Text
            key={i}
            className="text-slate-600 text-[9px]"
            numberOfLines={1}
            style={{ maxWidth: innerW / Math.max(values.length, 1) }}
          >
            {lab}
          </Text>
        ))}
      </View>
    </View>
  );
}
