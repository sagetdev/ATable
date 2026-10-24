import { Pressable } from "react-native";
import { Text } from "./Text";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

export function Chip({ label, selected = false, onPress, className = "" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-[34px] items-center justify-center rounded-full px-[12px] ${
        selected ? "bg-forest-700" : "border border-line bg-white"
      } ${className}`}
    >
      <Text className={`text-[11px] font-inter-semibold ${selected ? "text-white" : "text-ink"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
