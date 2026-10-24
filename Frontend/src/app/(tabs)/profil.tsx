import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SettingRow } from "@/components/SettingRow";
import { useApp } from "@/store/AppContext";

const ICON = "#174D38";

export default function Profil() {
  const router = useRouter();
  const { filters } = useApp();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-[20px] pt-[20px]">
          <Text className="text-[26px] font-inter-bold">Paramètres</Text>
          <Text className="mt-[4px] text-[12px] text-muted">Personnalise ton expérience.</Text>
        </View>

        <View className="mx-[19px] mt-[24px] h-[92px] flex-row items-center rounded-[20px] bg-forest-700 px-[14px]">
          <View className="size-[56px] items-center justify-center rounded-full bg-lime-300">
            <Text className="text-[35px] font-inter-bold text-forest-700">à</Text>
          </View>
          <View className="ml-[15px] flex-1">
            <Text className="text-[16px] font-inter-semibold text-white">Invité</Text>
            <Text className="mt-[7px] text-[10px] text-sage-300">Favoris enregistrés sur cet appareil</Text>
          </View>
        </View>

        <Text className="mx-[19px] mb-[11px] mt-[31px] text-[12px] font-inter-bold text-forest-500">Recherche</Text>
        <SettingRow
          icon={<Feather name="crosshair" size={17} color={ICON} />}
          title="Rayon par défaut"
          subtitle={`${filters.maxDistance} km`}
        />
        <SettingRow
          icon={<Feather name="list" size={17} color={ICON} />}
          title="Filtres préférés"
          subtitle="Modifier mes préférences"
          onPress={() => router.push("/filtres")}
        />
        <SettingRow
          icon={<Ionicons name="contrast" size={17} color={ICON} />}
          title="Apparence"
          subtitle="Système"
        />

        <Text className="mx-[19px] mb-[11px] mt-[19px] text-[12px] font-inter-bold text-forest-500">
          Données & confidentialité
        </Text>
        <SettingRow
          icon={<Feather name="target" size={17} color={ICON} />}
          title="Sources de données"
          subtitle="OpenStreetMap et partenaires"
        />
        <SettingRow
          icon={<Feather name="zap" size={17} color={ICON} />}
          title="Localisation"
          subtitle="Autorisation de l’appareil"
        />
        <SettingRow
          icon={<Feather name="info" size={17} color={ICON} />}
          title="Confidentialité"
          subtitle="Voir la politique"
        />
      </ScrollView>
    </Screen>
  );
}
