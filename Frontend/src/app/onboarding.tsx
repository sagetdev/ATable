import { View } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/store/AppContext";
import { TAB_HREF } from "@/lib/routes";

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useApp();

  const enter = () => {
    completeOnboarding();
    router.replace(TAB_HREF.decouvrir);
  };

  const useMyLocation = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
    } finally {
      enter();
    }
  };

  return (
    <Screen>
      <View className="mx-[19px] mt-[34px] h-[350px] overflow-hidden rounded-[28px] bg-accent-mint">
        <View className="absolute left-[35px] top-[48px] h-[220px] w-[250px] rounded-[26px] bg-map-shape" />
        <View className="absolute left-[35px] top-[115px] h-[9px] w-[250px] rounded-[5px] bg-white" />
        <View className="absolute left-[100px] top-[48px] h-[220px] w-[8px] rounded-[4px] bg-white" />
        <View className="absolute left-[130px] top-[115px] size-[88px] items-center justify-center rounded-full bg-forest-700">
          <Feather name="crosshair" size={40} color="#D8F27A" />
        </View>
        <View className="absolute left-[69px] top-[78px] size-[32px] items-center justify-center rounded-full bg-accent-orange">
          <Text className="text-[16px] text-white">🍴</Text>
        </View>
        <View className="absolute left-[233px] top-[200px] size-[32px] items-center justify-center rounded-full bg-white">
          <Text className="text-[16px]">☕</Text>
        </View>
      </View>

      <View className="mt-[36px] px-[21px]">
        <Text className="text-[28px] leading-[32px] font-inter-bold">
          {"Trouve les bonnes\nadresses autour de toi."}
        </Text>
        <Text className="mt-[16px] text-[13px] leading-[20px] text-muted">
          Utilise ta position pour découvrir les restaurants proches, ou saisis une adresse manuellement.
        </Text>
      </View>

      <View className="mt-auto px-[21px] pb-[24px]">
        <Button label="Utiliser ma position" onPress={useMyLocation} />
        <Button label="Entrer une adresse" variant="secondary" onPress={enter} className="mt-[14px]" />
        <Text className="mt-[20px] px-[16px] text-[10px] text-muted">
          Ta localisation n’est pas affichée publiquement.
        </Text>
      </View>
    </Screen>
  );
}
