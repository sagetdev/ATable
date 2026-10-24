import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Chip } from "@/components/ui/Chip";
import { Slider } from "@/components/ui/Slider";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { RESTAURANTS } from "@/data/restaurants";
import { DEFAULT_FILTERS, filterRestaurants } from "@/lib/filters";
import { fmt } from "@/lib/format";
import { useApp } from "@/store/AppContext";

const CUISINES = ["Tous", "Italien", "Japonais", "Asiatique"];
const BUDGETS = [1, 2, 3, 4];

export default function Filtres() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filters, setFilters } = useApp();
  const [draft, setDraft] = useState(filters);
  const patch = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }));
  const count = useMemo(() => filterRestaurants(RESTAURANTS, draft).length, [draft]);

  const apply = () => {
    setFilters(draft);
    router.back();
  };

  return (
    <View className="flex-1 justify-end">
      <Pressable onPress={() => router.back()} className="absolute inset-0 bg-forest-900/30" />

      <View className="max-h-[88%] rounded-t-[28px] bg-white">
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 21, paddingTop: 13, paddingBottom: insets.bottom + 24 }}
        >
          <View className="h-[5px] w-[58px] self-center rounded-[3px] bg-line" />

          <View className="mt-[18px] flex-row items-end justify-between">
            <Text className="text-[25px] font-inter-bold">Filtres</Text>
            <Pressable onPress={() => setDraft(DEFAULT_FILTERS)} hitSlop={10} className="pb-[4px]">
              <Text className="text-[11px] font-inter-semibold text-forest-500">Réinitialiser</Text>
            </Pressable>
          </View>

          <Text className="mt-[22px] text-[14px] font-inter-semibold">Type de cuisine</Text>
          <View className="mt-[12px] flex-row flex-wrap gap-[8px]">
            {CUISINES.map((c) => (
              <Chip key={c} label={c} selected={draft.cuisine === c} onPress={() => patch({ cuisine: c })} />
            ))}
          </View>

          <Text className="mt-[20px] text-[14px] font-inter-semibold">Budget par personne</Text>
          <View className="mt-[12px] flex-row flex-wrap gap-[8px]">
            {BUDGETS.map((b) => (
              <Chip
                key={b}
                label={"$".repeat(b)}
                selected={draft.budgets.includes(b)}
                onPress={() =>
                  patch({
                    budgets: draft.budgets.includes(b)
                      ? draft.budgets.filter((x) => x !== b)
                      : [...draft.budgets, b],
                  })
                }
              />
            ))}
          </View>

          <View className="mt-[20px] flex-row items-center justify-between">
            <Text className="text-[14px] font-inter-semibold">Note minimale</Text>
            <Text className="text-[12px] font-inter-semibold text-forest-500">{fmt(draft.minRating)} ★</Text>
          </View>
          <View className="mt-[8px]">
            <Slider value={draft.minRating} min={2.5} max={5} step={0.1} onChange={(v) => patch({ minRating: v })} />
          </View>

          <View className="mt-[14px] flex-row items-center justify-between">
            <Text className="text-[14px] font-inter-semibold">Distance maximale</Text>
            <Text className="text-[12px] font-inter-semibold text-forest-500">{draft.maxDistance} km</Text>
          </View>
          <View className="mt-[8px]">
            <Slider value={draft.maxDistance} min={1} max={15} step={1} onChange={(v) => patch({ maxDistance: v })} />
          </View>

          <View className="mt-[20px] gap-[16px]">
            <Checkbox label="Ouverts maintenant" checked={draft.openNow} onChange={(v) => patch({ openNow: v })} />
            <Checkbox label="Menu disponible" checked={draft.hasMenu} onChange={(v) => patch({ hasMenu: v })} />
          </View>

          <Button
            label={`Afficher ${count} restaurant${count > 1 ? "s" : ""}`}
            onPress={apply}
            className="mt-[28px]"
          />
        </ScrollView>
      </View>
    </View>
  );
}
