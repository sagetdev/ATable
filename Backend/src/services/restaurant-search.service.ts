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
  const data = await enrichRestaurantsWithGooglePlaces(found.data);
  const googleEnrichmentEnabled = env.GOOGLE_PLACES_ENTERPRISE_MODE && Boolean(env.GOOGLE_PLACES_API_KEY?.trim());
  return result(
    data,
    found.hasMore,
    "openstreetmap",
    googleEnrichmentEnabled ? OSM_ATTRIBUTION + " · " + GOOGLE_ATTRIBUTION : OSM_ATTRIBUTION,
  );
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
