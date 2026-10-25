import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { Chip } from "@/components/ui/Chip";
import { MenuItem } from "@/components/MenuItem";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/store/AppContext";
import { TAB_HREF } from "@/lib/routes";

export default function MenuRestaurant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { restaurants } = useApp();
  const r = restaurants.find((restaurant) => restaurant.id === id);
  const [category, setCategory] = useState("Tout");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (r?.menu ?? []).filter((m) =>
      (category === "Tout" || m.category === category) &&
      (!q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
    );
  }, [r, category, query]);

  const back = () => (router.canGoBack() ? router.back() : router.replace(TAB_HREF.decouvrir));

  return (
    <Screen>
      <View className="flex-row items-center px-[19px] pt-[16px]">
        <Pressable onPress={back} hitSlop={12}><Feather name="chevron-left" size={28} color="#17251D" /></Pressable>
        <Text className="ml-[16px] text-[22px] font-inter-bold">Menu</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Text className="mt-[14px] px-[21px] text-[12px] text-muted">{r?.name ?? "Restaurant"}</Text>
        {r?.website ? (
          <Pressable onPress={() => import("react-native").then(({ Linking }) => Linking.openURL(r.website!))} className="mx-[20px] mt-[10px]">
            <Text className="text-[12px] font-inter-semibold text-forest-700">Consulter le site officiel ↗</Text>
          </Pressable>
        ) : null}
        <View className="mt-[17px] px-[20px]"><SearchField value={query} onChangeText={setQuery} placeholder="Rechercher un plat" /></View>
        {r?.menu?.length ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-[14px] grow-0"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {["Tout", ...(r.menuCategories ?? [])].map((c) => <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}
            </ScrollView>
            <Text className="mb-[11px] mt-[21px] px-[19px] text-[18px] font-inter-bold">Les incontournables</Text>
            {items.length ? items.map((m) => <MenuItem key={m.id} item={m} />) : (
              <Text className="px-[21px] text-[12px] text-muted">Aucun plat dans cette catégorie.</Text>
            )}
          </>
        ) : (
          <View className="mx-[20px] mt-[22px] rounded-[16px] border border-line bg-white p-[16px]">
            <Text className="text-[15px] font-inter-semibold">Menu non disponible dans les données</Text>
            <Text className="mt-[8px] text-[12px] leading-[18px] text-muted">
              OpenStreetMap fournit surtout les coordonnées et les informations pratiques. Il ne fournit généralement pas les plats et leurs prix. Consulte le site officiel du restaurant s’il est indiqué.
            </Text>
          </View>
        )}
        <View className="mx-[19px] mt-[14px] h-[34px] justify-center rounded-[10px] bg-accent-mint px-[11px]">
          <Text className="text-[10px] font-inter-medium text-forest-500">Données de découverte : © OpenStreetMap contributors</Text>
        </View>
      </ScrollView>
      <BottomNav active={null} onNavigate={(key) => router.navigate(TAB_HREF[key])} />
    </Screen>
  );
}
