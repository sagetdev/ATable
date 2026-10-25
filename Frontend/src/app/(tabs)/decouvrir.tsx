import { useMemo } from "react";
import { Pressable, ScrollView, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Chip } from "@/components/ui/Chip";
import { RadiusSelector } from "@/components/RadiusSelector";
import { RestaurantCard } from "@/components/RestaurantCard";
import { SearchField } from "@/components/ui/SearchField";
import { filterRestaurants } from "@/lib/filters";
import { useApp } from "@/store/AppContext";

const CHIPS = ["Tous", "Italien", "Japonais", "Végétarien", "Asiatique"];

export default function Decouvrir() {
  const router = useRouter();
  const {
    location, filters, patchFilters, resetFilters, favorites, toggleFavorite,
    restaurants, loadingRestaurants, restaurantError, refreshRestaurants,
    searchQuery, setSearchQuery, attribution,
  } = useApp();
  const results = useMemo(() => filterRestaurants(restaurants, filters), [restaurants, filters]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-[20px] pt-[18px]">
          <Text className="text-[14px] font-inter-bold text-forest-700">À Table</Text>
          <Text className="mt-[14px] text-[25px] leading-[30px] font-inter-bold">
            {"Les bonnes adresses,\ntout près de toi."}
          </Text>
        </View>

        <View className="mx-[20px] mt-[16px]">
          <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un restaurant" />
        </View>

        <Pressable className="mx-[20px] mt-[10px] h-[42px] flex-row items-center justify-between rounded-[13px] border border-line bg-white px-[12px]">
          <View className="flex-row items-center">
            <Feather name="crosshair" size={13} color="#748078" />
            <Text className="ml-[8px] text-[12px] font-inter-medium">{location}</Text>
          </View>
          <Feather name="chevron-down" size={16} color="#748078" />
        </Pressable>

        <View className="mt-[12px]">
          <RadiusSelector value={filters.maxDistance} onChange={(v) => patchFilters({ maxDistance: v })} />
        </View>

        <View className="mt-[18px] flex-row items-center justify-between px-[20px]">
          <Pressable onPress={() => router.push("/filtres")} hitSlop={8}>
            <Text className="text-[16px] font-inter-semibold">Filtrer</Text>
          </Pressable>
          <Pressable onPress={() => void refreshRestaurants()} hitSlop={8} className="flex-row items-center">
            <Feather name="refresh-cw" size={12} color="#748078" />
            <Text className="ml-[6px] text-[11px] font-inter-medium text-muted">Actualiser</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-[12px] grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {CHIPS.map((c) => (
            <Chip key={c} label={c} selected={filters.cuisine === c} onPress={() => patchFilters({ cuisine: c })} />
          ))}
        </ScrollView>

        <View className="mt-[17px] px-[20px]">
          <Text className="text-[18px] font-inter-bold">À découvrir</Text>
          <Text className="mt-[4px] text-[11px] text-muted">
            {loadingRestaurants ? "Recherche des adresses à proximité…" : `${results.length} lieu${results.length > 1 ? "x" : ""} dans ce rayon`}
          </Text>
        </View>

        {loadingRestaurants && restaurants.length === 0 ? (
          <View className="items-center px-[24px] py-[42px]">
            <ActivityIndicator size="large" color="#174D38" />
            <Text className="mt-[12px] text-[12px] text-muted">Connexion à OpenStreetMap…</Text>
          </View>
        ) : restaurantError ? (
          <View className="mx-[20px] mt-[14px] rounded-[16px] border border-line bg-white p-[16px]">
            <Text className="text-[14px] font-inter-semibold">Impossible de charger les restaurants</Text>
            <Text className="mt-[7px] text-[12px] leading-[18px] text-muted">{restaurantError}</Text>
            <Pressable onPress={() => void refreshRestaurants()} className="mt-[14px] self-start rounded-full bg-forest-700 px-[16px] py-[9px]">
              <Text className="text-[12px] font-inter-semibold text-white">Réessayer</Text>
            </Pressable>
          </View>
        ) : results.length === 0 ? (
          <View className="mx-[20px] mt-[14px] rounded-[16px] border border-line bg-white p-[18px]">
            <Text className="text-[14px] font-inter-semibold">Aucune adresse trouvée</Text>
            <Text className="mt-[7px] text-[12px] leading-[18px] text-muted">
              Essaie un autre terme ou élargis le rayon. Les notes, menus et horaires ne sont pas toujours renseignés dans OpenStreetMap.
            </Text>
            <Pressable onPress={() => { setSearchQuery(""); resetFilters(); }} className="mt-[14px] self-start">
              <Text className="text-[12px] font-inter-semibold text-forest-700">Effacer la recherche et les filtres</Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-[9px]">
            {results.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} favorite={!!favorites[r.id]}
                onToggleFavorite={() => toggleFavorite(r.id)} />
            ))}
          </View>
        )}

        <Text className="px-[20px] pt-[12px] text-[10px] text-muted">{attribution}</Text>
      </ScrollView>
    </Screen>
  );
}
