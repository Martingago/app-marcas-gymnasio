import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  variant?: "default" | "primary" | "destructive";
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onRequestClose?: () => void;
  actions: AppDialogAction[];
};

export default function AppDialog({ visible, title, message, onRequestClose, actions }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View className="flex-1 bg-black/70 justify-center px-6">
        <View className="bg-slate-800 rounded-2xl p-5 border border-slate-600">
          <Text className="text-white text-xl font-bold mb-2">{title}</Text>
          <Text className="text-slate-400 text-sm leading-5 mb-6">{message}</Text>
          <View className="flex-row gap-3 flex-wrap">
            {actions.map((a, i) => {
              const base = "flex-1 min-w-[100px] py-3 rounded-xl items-center justify-center";
              const cls =
                a.variant === "destructive"
                  ? `${base} bg-red-700`
                  : a.variant === "primary"
                    ? `${base} bg-amber-600`
                    : `${base} bg-slate-700`;
              return (
                <TouchableOpacity
                  key={`${a.label}-${i}`}
                  className={cls}
                  onPress={a.onPress}
                >
                  <Text
                    className={`text-center font-semibold ${
                      a.variant === "primary" ? "text-slate-900 font-bold" : "text-slate-200"
                    } ${a.variant === "destructive" ? "text-white font-bold" : ""}`}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
