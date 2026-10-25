import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { MapPin } from "@/components/MapPin";
import { TONE_BG } from "@/lib/tones";
import { fmt } from "@/lib/format";
import { toRestaurant } from "@/lib/routes";
import { filterRestaurants } from "@/lib/filters";
import { useApp } from "@/store/AppContext";

const H_ROADS = [42, 125, 208, 291, 374, 457, 540];
const V_ROADS = [22, 91, 160, 229, 298, 367];
const pct = (x: number) => `${(x / 390) * 100}%` as const;

export default function Carte() {
  const router = useRouter();
  const { restaurants, coordinates, searchQuery, setSearchQuery, loadingRestaurants, restaurantError, filters } = useApp();\n  const visibleRestaurants = useMemo(() => filterRestaurants(restaurants, filters), [restaurants, filters]);
  const [selectedId, setSelectedId] = useState("");
  const selected = visibleRestaurants.find((r) => r.id === selectedId) ?? visibleRestaurants[0];

  const pins = useMemo(() => {
    if (!restaurants.length) return [];
    const lats = restaurants.map((r) => r.latitude ?? coordinates.latitude);
    const lngs = visibleRestaurants.map((r) => r.longitude ?? coordinates.longitude);
    const minLat = Math.min(...lats) - 0.003;
    const maxLat = Math.max(...lats) + 0.003;
    const minLng = Math.min(...lngs) - 0.003;
    const maxLng = Math.max(...lngs) + 0.003;
    return visibleRestaurants.map((restaurant, index) => {
      const lat = restaurant.latitude ?? coordinates.latitude;
      const lng = restaurant.longitude ?? coordinates.longitude;
      const x = 28 + ((lng - minLng) / Math.max(maxLng - minLng, 0.006)) * 300;
      const y = 75 + (1 - (lat - minLat) / Math.max(maxLat - minLat, 0.006)) * 365;
      return { id: restaurant.id, restaurantId: restaurant.id, emoji: restaurant.emoji, x: Math.round(x), y: Math.round(y), orange: index === 0 };
    });
  }, [visibleRestaurants, coordinates.latitude, coordinates.longitude]);

  return (
    <Screen>
      <View className="px-[20px] pt-[20px]">
        <Text className="text-[23px] font-inter-bold">Carte autour de toi</Text>
        <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un restaurant" className="mt-[16px]" />
      </View>

      <View className="mt-[15px] flex-1 overflow-hidden bg-map-land">
        {H_ROADS.map((y) => <View key={`h${y}`} className="absolute left-0 right-0 h-[5px] rounded-[3px] bg-white" style={{ top: y }} />)}
        {V_ROADS.map((x) => <View key={`v${x}`} className="absolute bottom-0 top-0 w-[4px] rounded-[3px] bg-white" style={{ left: pct(x) }} />)}
        <View className="absolute h-[96px] rounded-[18px] bg-map-park" style={{ left: pct(24), width: pct(110), top: 97 }} />
        <View className="absolute h-[80px] rounded-[18px] bg-map-park" style={{ left: pct(242), width: pct(115), top: 32 }} />
        <View className="absolute h-[115px] rounded-[22px] bg-map-water" style={{ left: pct(214), width: pct(140), top: 355 }} />

        {pins.map((pin) => (
          <MapPin key={pin.id} emoji={pin.emoji} x={pin.x} y={pin.y} orange={pin.orange}
            selected={pin.restaurantId === selected?.id} onPress={() => setSelectedId(pin.restaurantId)} />
        ))}

        <Pressable onPress={() => router.push("/filtres")}
          className="absolute left-[20px] top-[19px] h-[38px] flex-row items-center rounded-full border border-line bg-white px-[16px]">
          <Feather name="list" size={13} color="#17251D" />
          <Text className="ml-[8px] text-[12px] font-inter-semibold">Filtres</Text>
        </Pressable>

        {selected ? (
          <Pressable onPress={() => router.push(toRestaurant(selected.id))}
            className="absolute bottom-[14px] left-[18px] right-[18px] h-[118px] flex-row rounded-[20px] border border-line bg-white p-[9px]">
            <View className={`h-[98px] w-[84px] items-center justify-center rounded-[13px] ${TONE_BG[selected.tone]}`}>
              <Text className="text-[31px]">{selected.emoji}</Text>
            </View>
            <View className="ml-[13px] flex-1 pt-[7px]">
              <Text numberOfLines={1} className="text-[15px] font-inter-semibold">{selected.name}</Text>
              <Text className="mt-[7px] text-[11px] text-muted">{selected.cuisine}</Text>
              <Text className="mt-[6px] text-[11px] font-inter-semibold text-forest-500">
                {selected.rating > 0 ? `★ ${fmt(selected.rating)}` : "Note non disponible"} · {fmt(selected.distanceKm)} km
              </Text>
              <Text className="mt-[7px] text-[10px] text-muted">{selected.address ?? "Adresse non renseignée"}</Text>
            </View>
          </Pressable>
        ) : (
          <View className="absolute bottom-[20px] left-[20px] right-[20px] rounded-[18px] bg-white p-[18px]">
            <Text className="text-[14px] font-inter-semibold">{loadingRestaurants ? "Chargement de la carte…" : "Aucun restaurant à afficher"}</Text>
            <Text className="mt-[6px] text-[12px] text-muted">{restaurantError ?? "Essaie un autre rayon ou une autre recherche."}</Text>
          </View>
        )}
      </View>
      <Text className="px-[20px] py-[5px] text-[10px] text-muted">Aperçu schématique des positions, pas une carte routière.</Text>
    </Screen>
  );
}
