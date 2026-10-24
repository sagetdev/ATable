import { TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  className?: string;
};

export function SearchField({ value, onChangeText, placeholder, className = "" }: Props) {
  return (
    <View
      className={`h-[42px] flex-row items-center rounded-[13px] border border-line bg-white px-[13px] ${className}`}
    >
      <Feather name="search" size={14} color="#748078" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#748078"
        className="ml-[8px] flex-1 py-0 font-inter text-[12px] text-ink"
      />
    </View>
  );
}
