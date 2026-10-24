import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "./Text";

type Props = { label: string; checked: boolean; onChange: (v: boolean) => void };

export function Checkbox({ label, checked, onChange }: Props) {
  return (
    <Pressable onPress={() => onChange(!checked)} className="flex-row items-center">
      <View
        className={`size-[22px] items-center justify-center rounded-[6px] ${
          checked ? "bg-forest-700" : "border border-line bg-white"
        }`}
      >
        {checked ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
      </View>
      <Text className="ml-[12px] text-[13px] font-inter-medium">{label}</Text>
    </Pressable>
  );
}
