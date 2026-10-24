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
import { getRestaurant } from "@/data/restaurants";
import { TAB_HREF } from "@/lib/routes";

export default function MenuRestaurant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const r = getRestaurant(id);
  const [category, setCategory] = useState("Tout");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (r?.menu ?? []).filter(
      (m) =>
        (category === "Tout" || m.category === category) &&
        (!q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
    );
  }, [r, category, query]);

  const back = () => (router.canGoBack() ? router.back() : router.replace(TAB_HREF.decouvrir));

  return (
    <Screen>
      <View className="flex-row items-center px-[19px] pt-[16px]">
        <Pressable onPress={back} hitSlop={12}>
          <Feather name="chevron-left" size={28} color="#17251D" />
        </Pressable>
        <Text className="ml-[16px] text-[22px] font-inter-bold">Menu</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Text className="mt-[14px] px-[21px] text-[12px] text-muted">{`${r?.name ?? ""}  ·  menu du restaurant`}</Text>

        <View className="mt-[17px] px-[20px]">
          <SearchField value={query} onChangeText={setQuery} placeholder="Rechercher un plat" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-[14px] grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {["Tout", ...(r?.menuCategories ?? [])].map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>

        <Text className="mb-[11px] mt-[21px] px-[19px] text-[18px] font-inter-bold">Les incontournables</Text>

        {items.length ? (
          items.map((m) => <MenuItem key={m.id} item={m} />)
        ) : (
          <Text className="px-[21px] text-[12px] text-muted">
            {r?.menu?.length ? "Aucun plat dans cette catégorie." : "Menu indisponible pour le moment."}
          </Text>
        )}

        <View className="mx-[19px] mt-[4px] h-[34px] justify-center rounded-[10px] bg-accent-mint px-[11px]">
          <Text className="text-[10px] font-inter-medium text-forest-500">Prix indicatifs · source à vérifier</Text>
        </View>
      </ScrollView>

      <BottomNav active={null} onNavigate={(key) => router.navigate(TAB_HREF[key])} />
    </Screen>
  );
}
