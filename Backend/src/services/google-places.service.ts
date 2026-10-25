import { env } from "../config/env";
import type { RestaurantPlace } from "./openstreetmap.service";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  priceLevel?: string;
  formattedAddress?: string;
};
type GoogleSearchResponse = { places?: GooglePlace[] };

const GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const ENTERPRISE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.regularOpeningHours",
  "places.priceLevel",
].join(",");
const REQUEST_TIMEOUT_MS = 1800;

function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function priceLevelNumber(value: string | undefined): number | null {
  switch (value) {
    case "PRICE_LEVEL_INEXPENSIVE": return 1;
    case "PRICE_LEVEL_MODERATE": return 2;
    case "PRICE_LEVEL_EXPENSIVE": return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE": return 4;
    default: return null;
  }
}

function matchesRestaurant(place: GooglePlace, restaurant: RestaurantPlace): boolean {
  const googleName = normalizeName(place.displayName?.text ?? "");
  const osmName = normalizeName(restaurant.name);
  if (!googleName || !osmName) return false;

  const exactName = googleName === osmName;
  const similarName = Math.min(googleName.length, osmName.length) >= 6 &&
    (googleName.includes(osmName) || osmName.includes(googleName));
  if (!exactName && !similarName) return false;

  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return exactName;
  return distanceMeters(restaurant.latitude, restaurant.longitude, lat, lng) <= 350;
}

async function enrichOne(restaurant: RestaurantPlace, apiKey: string): Promise<RestaurantPlace> {
  const response = await fetch(GOOGLE_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": ENTERPRISE_FIELDS,
    },
    body: JSON.stringify({
      textQuery: restaurant.name,
      pageSize: 5,
      languageCode: "fr",
      locationBias: {
        circle: {
          center: { latitude: restaurant.latitude, longitude: restaurant.longitude },
          radius: 350,
        },
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Enrichment is optional: provider errors must never make restaurant discovery fail.
    console.warn("[Google Places enrichment] HTTP", response.status);
    return restaurant;
  }

  const payload = await response.json() as GoogleSearchResponse;
  const candidates = (payload.places ?? [])
    .filter((place) => matchesRestaurant(place, restaurant))
    .sort((a, b) => {
      const distanceFor = (place: GooglePlace) => {
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        return typeof lat === "number" && typeof lng === "number"
          ? distanceMeters(restaurant.latitude, restaurant.longitude, lat, lng)
          : Number.MAX_SAFE_INTEGER;
      };
      return distanceFor(a) - distanceFor(b);
    });
  const place = candidates[0];
  if (!place) return restaurant;

  const openingHours = place.regularOpeningHours?.weekdayDescriptions?.join(" · ") ?? null;
  const priceLevel = priceLevelNumber(place.priceLevel);
  return {
    ...restaurant,
    address: restaurant.address ?? place.formattedAddress ?? null,
    phone: restaurant.phone ?? place.nationalPhoneNumber ?? null,
    websiteUrl: place.websiteUri ?? restaurant.websiteUrl,
    openingHours: openingHours ?? restaurant.openingHours,
    rating: typeof place.rating === "number" ? place.rating : restaurant.rating,
    reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : restaurant.reviewCount,
    priceLevel: priceLevel ?? restaurant.priceLevel,
  };
}

/**
 * Enterprise mode is deliberately opt-in. Only the first configured number of
 * results is enriched, each Google request has a short timeout, and failures
 * leave the free OpenStreetMap results untouched.
 */
export async function enrichRestaurantsWithGooglePlaces(
  restaurants: RestaurantPlace[],
): Promise<RestaurantPlace[]> {
  if (!env.GOOGLE_PLACES_ENTERPRISE_MODE || !env.GOOGLE_PLACES_API_KEY?.trim()) {
    return restaurants;
  }

  const maxResults = env.GOOGLE_PLACES_ENRICHMENT_MAX_RESULTS;
  const apiKey = env.GOOGLE_PLACES_API_KEY.trim();
  const toEnrich = restaurants.slice(0, maxResults);
  const enriched = await Promise.all(toEnrich.map(async (restaurant) => {
    try {
      return await enrichOne(restaurant, apiKey);
    } catch (error) {
      console.warn(
        "[Google Places enrichment] request failed:",
        error instanceof Error ? error.name : "unknown error",
      );
      return restaurant;
    }
  }));

  return [...enriched, ...restaurants.slice(toEnrich.length)];
}
