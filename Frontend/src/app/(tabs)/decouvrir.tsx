import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Chip } from "@/components/ui/Chip";
import { RadiusSelector } from "@/components/RadiusSelector";
import { RestaurantCard } from "@/components/RestaurantCard";
import { NoResults } from "@/components/NoResults";
import { RESTAURANTS } from "@/data/restaurants";
import { filterRestaurants } from "@/lib/filters";
import { useApp } from "@/store/AppContext";

const CHIPS = ["Tous", "Italien", "Japonais", "Végétarien"];

export default function Decouvrir() {
  const router = useRouter();
  const { location, filters, patchFilters, resetFilters, favorites, toggleFavorite } = useApp();
  const results = useMemo(() => filterRestaurants(RESTAURANTS, filters), [filters]);

  if (results.length === 0) {
    const expandTo = Math.min(15, filters.maxDistance * 2);
    return (
      <NoResults
        expandTo={expandTo}
        onBack={resetFilters}
        onExpand={() => patchFilters({ maxDistance: expandTo })}
        onReset={resetFilters}
      />
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-[20px] pt-[18px]">
          <Text className="text-[14px] font-inter-bold text-forest-700">À Table</Text>
          <Text className="mt-[14px] text-[25px] leading-[30px] font-inter-bold">
            {"Les bonnes adresses,\ntout près de toi."}
          </Text>
        </View>

        <Pressable className="mx-[20px] mt-[14px] h-[42px] flex-row items-center justify-between rounded-[13px] border border-line bg-white px-[12px]">
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
          <Text className="text-[11px] font-inter-medium text-muted">Trier · Distance</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-[12px] grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {CHIPS.map((c) => (
            <Chip key={c} label={c} selected={filters.cuisine === c} onPress={() => patchFilters({ cuisine: c })} />
          ))}
        </ScrollView>

        <View className="mt-[17px] px-[20px]">
          <Text className="text-[18px] font-inter-bold">À découvrir</Text>
          <Text className="mt-[4px] text-[11px] text-muted">
            {results.length} lieu{results.length > 1 ? "x" : ""} dans ce rayon
          </Text>
        </View>

        <View className="mt-[9px]">
          {results.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              favorite={!!favorites[r.id]}
              onToggleFavorite={() => toggleFavorite(r.id)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
