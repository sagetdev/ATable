import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import type { Restaurant } from "@/data/restaurants";
import { TONE_BG } from "@/lib/tones";
import { fmt } from "@/lib/format";
import { toMenu, toRestaurant } from "@/lib/routes";

type Props = {
  restaurant: Restaurant;
  favorite: boolean;
  onToggleFavorite: () => void;
};

export function RestaurantCard({ restaurant: r, favorite, onToggleFavorite }: Props) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(toRestaurant(r.id))}
      className="mx-[18px] mb-[10px] flex-row rounded-[18px] border border-line bg-white p-[9px] active:opacity-90"
    >
      <View className={`h-[112px] w-[104px] overflow-hidden rounded-[13px] ${TONE_BG[r.tone]}`}>
        <View className="absolute left-0 right-0 top-[24px] items-center">
          <Text className="text-[34px]">{r.emoji}</Text>
        </View>
        <Pressable
          onPress={() => router.push(toMenu(r.id))}
          className="absolute bottom-[11px] left-[8px] right-[8px] h-[25px] items-center justify-center rounded-[8px] bg-white"
        >
          <Text className="text-[9px] font-inter-bold text-forest-700">MENU</Text>
        </Pressable>
      </View>

      <View className="ml-[14px] flex-1 pt-[6px]">
        <Text numberOfLines={1} className="h-[26px] text-[15px] font-inter-semibold">
          {r.name}
        </Text>
        <Text className="h-[26px] text-[11px] text-muted">
          {r.cuisine} · {"$".repeat(r.price)}
        </Text>
        <View className="h-[28px] flex-row items-baseline">
          <Text className="text-[12px] font-inter-semibold text-forest-500">★ {fmt(r.rating)}</Text>
          <Text className="ml-[26px] text-[11px] text-muted">· {fmt(r.distanceKm)} km</Text>
        </View>
        <Pressable onPress={() => router.push(toMenu(r.id))} className="flex-row items-center">
          <Text className="text-[11px] font-inter-semibold text-forest-500">Voir le menu</Text>
          <Feather name="arrow-up-right" size={11} color="#246747" style={{ marginLeft: 5 }} />
        </Pressable>
      </View>

      <Pressable onPress={onToggleFavorite} hitSlop={10} className="absolute right-[12px] top-[10px]">
        <Ionicons name={favorite ? "heart" : "heart-outline"} size={24} color="#174D38" />
      </Pressable>
    </Pressable>
  );
}
