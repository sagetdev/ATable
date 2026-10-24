import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { MapPin } from "@/components/MapPin";
import { MAP_PINS, RESTAURANTS, getRestaurant } from "@/data/restaurants";
import { TONE_BG } from "@/lib/tones";
import { fmt } from "@/lib/format";
import { toMenu, toRestaurant } from "@/lib/routes";

const H_ROADS = [42, 125, 208, 291, 374, 457, 540];
const V_ROADS = [22, 91, 160, 229, 298, 367];
const pct = (x: number) => `${(x / 390) * 100}%` as const;

export default function Carte() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("forno-verde");
  const selected = getRestaurant(selectedId) ?? RESTAURANTS[0];
  const q = query.trim().toLowerCase();

  const pins = MAP_PINS.filter((p) => {
    if (!q) return true;
    const r = getRestaurant(p.restaurantId);
    return !!r && r.name.toLowerCase().includes(q);
  });

  return (
    <Screen>
      <View className="px-[20px] pt-[20px]">
        <Text className="text-[23px] font-inter-bold">Carte autour de toi</Text>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Restaurants à proximité"
          className="mt-[16px]"
        />
      </View>

      <View className="mt-[15px] flex-1 overflow-hidden bg-map-land">
        {H_ROADS.map((y) => (
          <View key={`h${y}`} className="absolute left-0 right-0 h-[5px] rounded-[3px] bg-white" style={{ top: y }} />
        ))}
        {V_ROADS.map((x) => (
          <View key={`v${x}`} className="absolute bottom-0 top-0 w-[4px] rounded-[3px] bg-white" style={{ left: pct(x) }} />
        ))}
        <View className="absolute h-[96px] rounded-[18px] bg-map-park" style={{ left: pct(24), width: pct(110), top: 97 }} />
        <View className="absolute h-[80px] rounded-[18px] bg-map-park" style={{ left: pct(242), width: pct(115), top: 32 }} />
        <View className="absolute h-[115px] rounded-[22px] bg-map-water" style={{ left: pct(214), width: pct(140), top: 355 }} />

        {pins.map((p) => (
          <MapPin
            key={p.id}
            emoji={p.emoji}
            x={p.x}
            y={p.y}
            orange={p.orange}
            selected={!!p.restaurantId && p.restaurantId === selectedId}
            onPress={p.restaurantId ? () => setSelectedId(p.restaurantId!) : undefined}
          />
        ))}

        <Pressable
          onPress={() => router.push("/filtres")}
          className="absolute left-[20px] top-[19px] h-[38px] flex-row items-center rounded-full border border-line bg-white px-[16px]"
        >
          <Feather name="list" size={13} color="#17251D" />
          <Text className="ml-[8px] text-[12px] font-inter-semibold">Filtres</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(toRestaurant(selected.id))}
          className="absolute bottom-[14px] left-[18px] right-[18px] h-[118px] flex-row rounded-[20px] border border-line bg-white p-[9px]"
        >
          <View className={`h-[98px] w-[84px] items-center justify-center rounded-[13px] ${TONE_BG[selected.tone]}`}>
            <Text className="text-[31px]">{selected.emoji}</Text>
          </View>
          <View className="ml-[13px] flex-1 pt-[7px]">
            <Text numberOfLines={1} className="text-[15px] font-inter-semibold">
              {selected.name}
            </Text>
            <Text className="mt-[7px] text-[11px] text-muted">
              {selected.cuisine} · {"$".repeat(selected.price)}
            </Text>
            <Text className="mt-[6px] text-[11px] font-inter-semibold text-forest-500">
              {`★ ${fmt(selected.rating)}  ·  ${fmt(selected.distanceKm)} km`}
            </Text>
            <Pressable onPress={() => router.push(toMenu(selected.id))} className="mt-[9px] flex-row items-center">
              <Text className="text-[11px] font-inter-semibold text-forest-700">Menu</Text>
              <Feather name="arrow-up-right" size={11} color="#174D38" style={{ marginLeft: 5 }} />
            </Pressable>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}
