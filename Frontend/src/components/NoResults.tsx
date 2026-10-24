import { Pressable, ScrollView, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";

type Props = {
  expandTo: number;
  onBack: () => void;
  onExpand: () => void;
  onReset: () => void;
};

export function NoResults({ expandTo, onBack, onExpand, onReset }: Props) {
  return (
    <Screen>
      <View className="flex-row items-center px-[19px] pt-[16px]">
        <Pressable onPress={onBack} hitSlop={12}>
          <Feather name="chevron-left" size={28} color="#17251D" />
        </Pressable>
        <Text className="ml-[16px] text-[22px] font-inter-bold">Découvrir</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="mt-[62px] h-[270px] w-[310px] self-center rounded-[28px] bg-accent-mint">
          <View className="absolute left-[72px] top-[57px] h-[112px] w-[166px] rounded-full bg-white" />
          <View className="absolute left-[92px] top-[77px] h-[72px] w-[126px] rounded-full bg-accent-rose" />
          <Text className="absolute left-[124px] top-[80px] text-[42px]">🍽️</Text>
          <View className="absolute left-[185px] top-[136px] size-[64px] items-center justify-center rounded-full bg-lime-300">
            <Feather name="search" size={28} color="#174D38" />
          </View>
        </View>

        <View className="mt-[28px] px-[29px]">
          <Text className="text-[24px] font-inter-bold">Rien dans ce coin…</Text>
          <Text className="mt-[8px] text-[13px] leading-[20px] text-muted">
            On n’a pas trouvé de restaurant avec ces critères. Essaie d’élargir ton rayon ou d’enlever un filtre.
          </Text>
        </View>

        <View className="mt-auto px-[21px] pt-[32px]">
          <Button label={`Élargir à ${expandTo} km`} onPress={onExpand} />
          <Button label="Réinitialiser les filtres" variant="secondary" onPress={onReset} className="mt-[13px]" />
        </View>
      </ScrollView>
    </Screen>
  );
}
