import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Text } from "@/components/ui/Text";

type Props = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export function SettingRow({ icon, title, subtitle, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-[19px] mb-[6px] h-[66px] flex-row items-center rounded-[15px] border border-line bg-white px-[11px] active:opacity-90"
    >
      <View className="size-[42px] items-center justify-center rounded-[12px] bg-accent-mint">{icon}</View>
      <View className="ml-[12px] flex-1">
        <Text className="text-[13px] font-inter-semibold">{title}</Text>
        <Text className="mt-[5px] text-[10px] text-muted">{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#748078" />
    </Pressable>
  );
}
