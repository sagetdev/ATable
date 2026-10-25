import { Linking, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { LinkBadge, StatusBadge } from "@/components/ui/Badge";
import { useApp } from "@/store/AppContext";
import { isOpenNow } from "@/lib/filters";
import { TONE_BG } from "@/lib/tones";
import { fmt } from "@/lib/format";
import { TAB_HREF, toMenu } from "@/lib/routes";
import { useApp } from "@/store/AppContext";

export default function FicheRestaurant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useApp();
  const r = getRestaurant(id);

  const back = () => (router.canGoBack() ? router.back() : router.replace(TAB_HREF.decouvrir));

  if (!r) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas-50">
        <Text className="text-[14px] text-muted">{loadingRestaurants ? "Chargement de la fiche…" : "Restaurant introuvable. Reviens à la découverte et réessaie."}</Text>
      </View>
    );
  }

  const fav = !!favorites[r.id];
  const open = isOpenNow(r);

  return (
    <View className="flex-1 bg-canvas-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View className={`h-[300px] ${TONE_BG[r.tone]}`}>
          <View
            className="absolute left-[21px] right-[24px] flex-row items-center justify-between"
            style={{ top: insets.top + 18 }}
          >
            <Pressable onPress={back} hitSlop={12}>
              <Feather name="chevron-left" size={32} color="#17251D" />
            </Pressable>
            <Pressable onPress={() => toggleFavorite(r.id)} hitSlop={12}>
              <Ionicons name={fav ? "heart" : "heart-outline"} size={30} color="#174D38" />
            </Pressable>
          </View>
          <View className="absolute left-0 right-0 top-[96px] items-center">
            <Text className="text-[88px]">{r.emoji}</Text>
          </View>
          <View className="absolute bottom-[31px] h-[8px] w-[74px] self-center rounded-[4px] bg-white" />
        </View>

        <View className="-mt-[20px] rounded-t-[28px] bg-canvas-50 px-[21px] pt-[24px]">
          <Text className="text-[27px] font-inter-bold">{r.name}</Text>
          <Text className="mt-[3px] text-[12px] text-muted">{r.descriptor ?? r.cuisine}</Text>

          <View className="mt-[14px] flex-row items-baseline">
            <Text className="text-[13px] font-inter-semibold text-forest-500">{r.rating > 0 ? `★ ${fmt(r.rating)}` : "Note non disponible"}</Text>
            {r.reviews ? <Text className="ml-[17px] text-[11px] text-muted">({r.reviews} avis)</Text> : null}
            <Text className="ml-[19px] text-[11px] text-muted">· {fmt(r.distanceKm)} km</Text>
          </View>

          {r.website ? (
            <View className="mt-[16px] flex-row gap-[11px]">
              {r.hours ? (
                <StatusBadge open={open} until={r.hours.close} opensAt={r.hours.open} />
              ) : null}
              {r.website ? <LinkBadge label="Site officiel ↗" onPress={() => Linking.openURL(r.website!)} /> : null}
            </View>
          ) : null}

          {r.about ? (
            <>
              <Text className="mt-[19px] text-[16px] font-inter-bold">À propos</Text>
              <Text className="mt-[8px] text-[12px] leading-[16px] text-muted">{r.about}</Text>
            </>
          ) : null}

          <Text className="mt-[26px] text-[15px] font-inter-semibold">Informations pratiques</Text>
          <View className="mt-[8px]">
            {r.address ? (
              <View className="h-[30px] flex-row items-center">
                <Feather name="map-pin" size={13} color="#748078" />
                <Text className="ml-[10px] text-[12px]">{r.address}</Text>
              </View>
            ) : null}
            {r.hours ? (
              <View className="h-[30px] flex-row items-center">
                <Feather name="clock" size={13} color="#748078" />
                <Text className="ml-[10px] text-[12px]">{`Aujourd’hui ${r.hours.open} h – ${r.hours.close} h`}</Text>
              </View>
            ) : null}
            <View className="h-[30px] flex-row items-center">
              <Feather name="dollar-sign" size={13} color="#748078" />
              <Text className="ml-[10px] text-[12px]">Gamme de prix : {"$".repeat(r.price)}</Text>
            </View>
          </View>

          {r.menu?.length ? (
            <Pressable
              onPress={() => router.push(toMenu(r.id))}
              className="mt-[19px] h-[82px] flex-row items-center justify-between rounded-[17px] border border-line bg-white px-[16px] active:opacity-90"
            >
              <View>
                <Text className="text-[15px] font-inter-semibold">Voir le menu</Text>
                <Text className="mt-[8px] text-[11px] text-muted">{r.menuSummary ?? "Plats et prix"}</Text>
              </View>
              <Feather name="arrow-right" size={22} color="#174D38" />
            </Pressable>
          ) : null}

          {r.address ? (
            <Button
              label="Itinéraire"
              className="mt-[14px]"
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.address}`)}`
                )
              }
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
