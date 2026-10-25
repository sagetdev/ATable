import { env } from "../config/env";
import {
  searchNearbyRestaurants as searchOpenStreetMapNearby,
  searchRestaurantsByText as searchOpenStreetMapByText,
  type RestaurantPlace,
} from "./openstreetmap.service";
import {
  enrichRestaurantsWithGooglePlaces,
  searchGoogleNearbyRestaurants,
  searchGoogleRestaurantsByText,
} from "./google-places.service";
import { getWikidataEnrichment } from "./wikidata.service";

export type RestaurantSearchResult = {
  data: RestaurantPlace[];
  hasMore: boolean;
  source: "google" | "openstreetmap" | "multi";
  attribution: string;
};

type SearchInput = {
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
  offset?: number;
};

const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
const GOOGLE_ATTRIBUTION = "Google Maps Platform";

function result(
  data: RestaurantPlace[],
  hasMore: boolean,
  source: RestaurantSearchResult["source"],
  attribution: string,
): RestaurantSearchResult {
  return { data, hasMore, source, attribution };
}

async function finishOsmResult(found: { data: RestaurantPlace[]; hasMore: boolean }): Promise<RestaurantSearchResult> {
  // Prefer Google Places photos for the first capped set, then use openly
  // licensed Wikimedia Commons images when OSM links a restaurant to Wikidata.
  // Wikidata lookups are cached by their service and only attempted for results
  // that still have no image, so this remains a best-effort, low-cost fallback.
  const data = await enrichRestaurantsWithGooglePlaces(found.data);
  const wikidataCandidates = data.filter((restaurant) => !restaurant.imageUrl && restaurant.wikidataId).slice(0, 10);
  await Promise.all(wikidataCandidates.map(async (restaurant) => {
    try {
      const details = await getWikidataEnrichment(restaurant.wikidataId!);
      if (!details?.imageUrl) return;
      restaurant.imageUrl = details.imageUrl;
      restaurant.imageAttribution = details.imageArtist ?? details.imageCredit ?? "Wikimedia Commons";
      restaurant.imageAttributionUrl = details.imageSourceUrl;
    } catch {
      // Photo enrichment is optional; never fail restaurant discovery because of it.
    }
  }));
  const googleEnrichmentEnabled = env.GOOGLE_PLACES_ENTERPRISE_MODE && Boolean(env.GOOGLE_PLACES_API_KEY?.trim());
  const hasWikimediaImages = wikidataCandidates.some((restaurant) => Boolean(restaurant.imageUrl));
  const attribution = [
    OSM_ATTRIBUTION,
    googleEnrichmentEnabled ? GOOGLE_ATTRIBUTION : null,
    hasWikimediaImages ? "Wikidata · Wikimedia Commons" : null,
  ].filter(Boolean).join(" · ");
  return result(data, found.hasMore, "openstreetmap", attribution);
}

export async function searchNearby(input: SearchInput): Promise<RestaurantSearchResult> {
  if (env.RESTAURANT_PROVIDER_MODE === "google") {
    const found = await searchGoogleNearbyRestaurants(input);
    return result(found.data, found.hasMore, "google", GOOGLE_ATTRIBUTION);
  }

  if (env.RESTAURANT_PROVIDER_MODE === "openstreetmap") {
    const found = await searchOpenStreetMapNearby(input);
    return result(found.data, found.hasMore, "openstreetmap", OSM_ATTRIBUTION);
  }

  try {
    return await finishOsmResult(await searchOpenStreetMapNearby(input));
  } catch (osmError) {
    if (!env.GOOGLE_PLACES_API_KEY?.trim()) throw osmError;
    console.warn("[Restaurant providers] OpenStreetMap failed; trying Google Places discovery.");
    const found = await searchGoogleNearbyRestaurants(input);
    return result(found.data, found.hasMore, "google", GOOGLE_ATTRIBUTION);
  }
}

export async function searchByText(input: SearchInput & { query: string }): Promise<RestaurantSearchResult> {
  if (env.RESTAURANT_PROVIDER_MODE === "google") {
    const found = await searchGoogleRestaurantsByText(input);
    return result(found.data, found.hasMore, "google", GOOGLE_ATTRIBUTION);
  }

  if (env.RESTAURANT_PROVIDER_MODE === "openstreetmap") {
    const found = await searchOpenStreetMapByText(input);
    return result(found.data, found.hasMore, "openstreetmap", OSM_ATTRIBUTION);
  }

  try {
    return await finishOsmResult(await searchOpenStreetMapByText(input));
  } catch (osmError) {
    if (!env.GOOGLE_PLACES_API_KEY?.trim()) throw osmError;
    console.warn("[Restaurant providers] OpenStreetMap search failed; trying Google Places discovery.");
    const found = await searchGoogleRestaurantsByText(input);
    return result(found.data, found.hasMore, "google", GOOGLE_ATTRIBUTION);
  }
}
