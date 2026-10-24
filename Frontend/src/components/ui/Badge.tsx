import { Pressable, View } from "react-native";
import { Text } from "./Text";
import { fmt } from "@/lib/format";

export function RatingBadge({ rating }: { rating: number }) {
  return (
    <View className="h-[36px] justify-center rounded-[18px] bg-accent-mint px-[20px]">
      <Text className="text-[12px] font-inter-semibold text-forest-500">{`★  ${fmt(rating)}`}</Text>
    </View>
  );
}

export function StatusBadge({ open, until, opensAt }: { open: boolean; until: number; opensAt: number }) {
  return (
    <View
      className={`h-[30px] justify-center rounded-[15px] px-[10px] ${open ? "bg-accent-mint" : "bg-line"}`}
    >
      <Text className={`text-[9px] font-inter-semibold ${open ? "text-forest-500" : "text-muted"}`}>
        {open ? `●  Ouvert jusqu’à ${until} h` : `●  Fermé · ouvre à ${opensAt} h`}
      </Text>
    </View>
  );
}

export function LinkBadge({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-[30px] justify-center rounded-[15px] border border-line bg-white px-[11px] active:opacity-80"
    >
      <Text className="text-[9px] font-inter-semibold text-ink">{label}</Text>
    </Pressable>
  );
}
