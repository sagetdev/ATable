import { Image, Linking, Pressable, ScrollView, View } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { LinkBadge } from "@/components/ui/Badge";
import { useApp } from "@/store/AppContext";
import { TONE_BG } from "@/lib/tones";
import { fmt } from "@/lib/format";
import { FoursquareDetails, getFoursquareDetails, getWikidataDetails, WikidataDetails } from "@/lib/api";
import { TAB_HREF, toMenu } from "@/lib/routes";

export default function FicheRestaurant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite, restaurants, loadingRestaurants, restaurantError } = useApp();
  const r = restaurants.find((restaurant) => restaurant.id === id);
  const [wikidataDetails, setWikidataDetails] = useState<WikidataDetails | null>(null);
  const [foursquareDetails, setFoursquareDetails] = useState<FoursquareDetails | null>(null);

  useEffect(() => {
    let active = true;
    setWikidataDetails(null);
    setFoursquareDetails(null);
    if (r?.wikidataId) {
      void getWikidataDetails(r.wikidataId).then((data) => {
        if (active) setWikidataDetails(data);
      }).catch(() => {
        if (active) setWikidataDetails(null);
      });
    }
    if (r?.latitude !== undefined && r.longitude !== undefined) {
      void getFoursquareDetails({ name: r.name, latitude: r.latitude, longitude: r.longitude }).then((data) => {
        if (active) setFoursquareDetails(data);
      }).catch(() => {
        if (active) setFoursquareDetails(null);
      });
    }
    return () => { active = false; };
  }, [r?.id, r?.wikidataId, r?.name, r?.latitude, r?.longitude]);

  const back = () => (router.canGoBack() ? router.back() : router.replace(TAB_HREF.decouvrir));
  if (!r) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas-50 px-[24px]">
        <Text className="text-[14px] text-muted">{loadingRestaurants ? "Chargement de la fiche…" : restaurantError ?? "Restaurant introuvable. Reviens à la découverte et réessaie."}</Text>
        <Pressable onPress={back} className="mt-[16px]">
          <Text className="text-[13px] font-inter-semibold text-forest-700">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const fav = !!favorites[r.id];
  const imageUrl = r.imageUrl ?? wikidataDetails?.imageUrl ?? foursquareDetails?.imageUrl ?? undefined;
  const officialWebsite = r.website ?? wikidataDetails?.officialWebsite ?? foursquareDetails?.websiteUrl ?? undefined;
  const imageCredit = wikidataDetails?.imageUrl
    ? [wikidataDetails.imageArtist, wikidataDetails.imageLicense, wikidataDetails.imageSourceUrl].filter(Boolean).join(" · ")
    : foursquareDetails?.imageUrl
      ? [foursquareDetails.imageAttribution, foursquareDetails.imageSourceUrl].filter(Boolean).join(" · ")
      : null;

  return (
    <View className="flex-1 bg-canvas-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View className={"h-[300px] " + TONE_BG[r.tone]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} resizeMode="cover" style={{ position: "absolute", width: "100%", height: "100%" }} />
          ) : (
            <View className="absolute left-0 right-0 top-[96px] items-center"><Text className="text-[88px]">{r.emoji}</Text></View>
          )}
          <View className="absolute left-[21px] right-[24px] flex-row items-center justify-between" style={{ top: insets.top + 18 }}>
            <Pressable onPress={back} hitSlop={12}><Feather name="chevron-left" size={32} color={imageUrl ? "#FFFFFF" : "#17251D"} /></Pressable>
            <Pressable onPress={() => toggleFavorite(r.id)} hitSlop={12}>
              <Ionicons name={fav ? "heart" : "heart-outline"} size={30} color={imageUrl ? "#FFFFFF" : "#174D38"} />
            </Pressable>
          </View>
          <View className="absolute bottom-[31px] h-[8px] w-[74px] self-center rounded-[4px] bg-white" />
        </View>

        <View className="-mt-[20px] rounded-t-[28px] bg-canvas-50 px-[21px] pt-[24px]">
          <Text className="text-[27px] font-inter-bold">{r.name}</Text>
          <Text className="mt-[3px] text-[12px] text-muted">{r.descriptor ?? r.cuisine}</Text>
          <View className="mt-[14px] flex-row items-baseline">
            <Text className="text-[13px] font-inter-semibold text-forest-500">
              {r.rating > 0 ? "★ " + fmt(r.rating) : foursquareDetails?.rating != null ? "★ " + fmt(foursquareDetails.rating) + " / 10 · Foursquare" : "Note non disponible"}
            </Text>
            <Text className="ml-[19px] text-[11px] text-muted">· {fmt(r.distanceKm)} km</Text>
          </View>

          {officialWebsite ? (
            <View className="mt-[16px] flex-row gap-[11px]">
              <LinkBadge label="Site officiel ↗" onPress={() => Linking.openURL(officialWebsite)} />
            </View>
          ) : null}

          {imageCredit ? (
            <Pressable onPress={() => {
              const sourceUrl = wikidataDetails?.imageUrl ? wikidataDetails.imageSourceUrl : foursquareDetails?.imageSourceUrl;
              if (sourceUrl) void Linking.openURL(sourceUrl);
            }} className="mt-[8px]">
              <Text className="text-[9px] text-muted">Photo : {imageCredit}</Text>
            </Pressable>
          ) : null}

          {r.about || wikidataDetails?.description ? (
            <>
              <Text className="mt-[19px] text-[16px] font-inter-bold">À propos</Text>
              <Text className="mt-[8px] text-[12px] leading-[16px] text-muted">{wikidataDetails?.description ?? r.about}</Text>
            </>
          ) : null}

          <Text className="mt-[26px] text-[15px] font-inter-semibold">Informations pratiques</Text>
          <View className="mt-[8px]">
            {r.address ? (
              <View className="flex-row items-start py-[7px]">
                <Feather name="map-pin" size={13} color="#748078" />
                <Text className="ml-[10px] flex-1 text-[12px]">{r.address}</Text>
              </View>
            ) : null}
            {r.openingHours ? (
              <View className="flex-row items-start py-[7px]">
                <Feather name="clock" size={13} color="#748078" />
                <Text className="ml-[10px] flex-1 text-[12px]">{r.openingHours}</Text>
              </View>
            ) : null}
            {r.phone ? (
              <Pressable onPress={() => Linking.openURL("tel:" + r.phone)} className="flex-row items-center py-[7px]">
                <Feather name="phone" size={13} color="#748078" />
                <Text className="ml-[10px] text-[12px]">{r.phone}</Text>
              </Pressable>
            ) : null}
            <View className="flex-row items-center py-[7px]">
              <Feather name="dollar-sign" size={13} color="#748078" />
              <Text className="ml-[10px] text-[12px]">{r.priceKnown === false ? "Gamme de prix non renseignée" : "Gamme de prix : " + "$".repeat(r.price)}</Text>
            </View>
            {wikidataDetails?.wikipediaUrl ? (
              <Pressable onPress={() => Linking.openURL(wikidataDetails.wikipediaUrl!)} className="flex-row items-center py-[7px]">
                <Feather name="book-open" size={13} color="#748078" />
                <Text className="ml-[10px] text-[12px]">Article Wikipédia</Text>
              </Pressable>
            ) : null}
          </View>

          {r.menu?.length ? (
            <Pressable onPress={() => router.push(toMenu(r.id))} className="mt-[19px] h-[82px] flex-row items-center justify-between rounded-[17px] border border-line bg-white px-[16px]">
              <View>
                <Text className="text-[15px] font-inter-semibold">Voir le menu</Text>
                <Text className="mt-[8px] text-[11px] text-muted">{r.menuSummary ?? "Plats et prix"}</Text>
              </View>
              <Feather name="arrow-right" size={22} color="#174D38" />
            </Pressable>
          ) : null}

          {r.address ? (
            <Button label="Itinéraire" className="mt-[14px]" onPress={() => Linking.openURL("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r.name + " " + r.address))} />
          ) : null}
          <Text className="mt-[14px] text-[10px] text-muted">{r.attribution ?? "© OpenStreetMap contributors"}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
