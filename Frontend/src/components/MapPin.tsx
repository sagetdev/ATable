import { Pressable } from "react-native";
import { Text } from "@/components/ui/Text";

type Props = {
  emoji: string;
  x: number;
  y: number;
  orange?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

export function MapPin({ emoji, x, y, orange, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`absolute size-[44px] items-center justify-center rounded-full ${
        orange ? "bg-accent-orange" : "bg-forest-700"
      } ${selected ? "border-[3px] border-lime-300" : ""}`}
      style={{ left: `${(x / 390) * 100}%`, top: y }}
    >
      <Text className="text-[20px] text-white">{emoji}</Text>
    </Pressable>
  );
}
