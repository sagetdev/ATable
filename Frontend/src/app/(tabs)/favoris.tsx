import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { Chip } from "@/components/ui/Chip";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RESTAURANTS } from "@/data/restaurants";
import { useApp } from "@/store/AppContext";

const TABS = [
  { key: "all", label: "Tous" },
  { key: "todo", label: "À tester" },
  { key: "done", label: "Déjà testés" },
] as const;

export default function Favoris() {
  const { favorites, toggleFavorite } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const saved = RESTAURANTS.filter((r) => !!favorites[r.id]);
  const list = saved.filter(
    (r) => (tab === "all" || favorites[r.id] === tab) && (!q || r.name.toLowerCase().includes(q))
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-[20px] pt-[20px]">
          <Text className="text-[26px] font-inter-bold">Tes favoris</Text>
          <Text className="mt-[3px] text-[12px] text-muted">Les adresses à garder sous le coude.</Text>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher dans mes favoris"
            className="mt-[17px]"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-[16px] grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {TABS.map((t) => (
            <Chip key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />
          ))}
        </ScrollView>

        <Text className="mt-[18px] px-[20px] text-[17px] font-inter-semibold">Enregistrés · {list.length}</Text>

        <View className="mt-[13px]">
          {list.map((r) => (
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
