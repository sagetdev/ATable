import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import type { MenuItemData } from "@/data/restaurants";
import { TONE_BG } from "@/lib/tones";
import { euro } from "@/lib/format";

export function MenuItem({ item }: { item: MenuItemData }) {
  return (
    <View className="mx-[19px] mb-[10px] h-[104px] flex-row rounded-[17px] border border-line bg-white p-[8px]">
      <View className={`size-[86px] items-center justify-center rounded-[12px] ${TONE_BG[item.tone]}`}>
        <Text className="text-[32px]">{item.emoji}</Text>
      </View>
      <View className="ml-[13px] flex-1 pt-[5px]">
        <Text numberOfLines={1} className="h-[25px] text-[14px] font-inter-semibold">
          {item.name}
        </Text>
        <Text numberOfLines={1} className="h-[34px] text-[10px] text-muted">
          {item.description}
        </Text>
        <Text className="text-[12px] font-inter-bold text-forest-500">{euro(item.price)}</Text>
      </View>
    </View>
  );
}
