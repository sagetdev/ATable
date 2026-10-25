import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
};

export function RadiusSelector({ value, onChange, min = 1, max = 10 }: Props) {
  const ratio = (value - min) / (max - min);
  return (
    <View className="mx-[20px] h-[66px] flex-row items-center justify-between rounded-[17px] bg-forest-700 pl-[14px] pr-[8px]">
      <View>
        <Text className="text-[11px] font-inter-medium text-sage-300">Rayon de recherche</Text>
        <Text className="mt-[4px] text-[18px] font-inter-bold text-white">{value} km</Text>
      </View>
      <View className="flex-row items-center">
        <Pressable hitSlop={12} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text className="text-[22px] font-inter-bold text-lime-300">−</Text>
        </Pressable>
        <View className="mx-[15px] h-[4px] w-[28px] overflow-hidden rounded-[2px] bg-sage-500/40">
          <View className="h-full rounded-[2px] bg-sage-500" style={{ width: `${Math.max(0.1, ratio) * 100}%` }} />
        </View>
        <Pressable hitSlop={12} onPress={() => onChange(Math.min(max, value + 1))}>
          <Text className="text-[22px] font-inter-bold text-lime-300">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
