import { env } from "../config/env";
import type { RestaurantPlace } from "./openstreetmap.service";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  priceLevel?: string;
  formattedAddress?: string;
  photos?: Array<{ name?: string; authorAttributions?: Array<{ displayName?: string; uri?: string }> }>;
};
type GoogleSearchResponse = { places?: GooglePlace[]; nextPageToken?: string };

const GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const BASIC_FIELDS = [
  "places.id", "places.displayName", "places.location", "places.formattedAddress",
  "places.primaryTypeDisplayName", "places.types", "nextPageToken",
].join(",");
const ENTERPRISE_FIELDS = [
  ...BASIC_FIELDS.split(","),
  "places.rating", "places.userRatingCount", "places.websiteUri",
  "places.nationalPhoneNumber", "places.regularOpeningHours", "places.priceLevel",
  "places.photos",
].join(",");
const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const ENRICHMENT_CACHE_TTL_MS = 60 * 60 * 1000;
const GOOGLE_ATTRIBUTION = "Google Maps Platform";

let requestsToday = 0;
let counterDay = new Date().toISOString().slice(0, 10);
const searchCache = new Map<string, { expiresAt: number; pages: GoogleSearchResponse[] }>();
const enrichmentCache = new Map<string, { expiresAt: number; value: RestaurantPlace }>();

function utcDay(): string { return new Date().toISOString().slice(0, 10); }

function reserveGoogleRequest(): void {
  const today = utcDay();
  if (today !== counterDay) {
    counterDay = today;
    requestsToday = 0;
  }
  if (requestsToday >= env.GOOGLE_PLACES_MAX_REQUESTS_PER_DAY) {
    throw new Error("GOOGLE_PLACES_DAILY_LIMIT_REACHED");
  }
  // Increment before network I/O so concurrent requests cannot exceed this process's cap.
  requestsToday += 1;
}

function requireApiKey(): string {
  const key = env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY_MISSING");
  return key;
}

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
  const targetName = normalizeName(restaurant.name);
  if (!googleName || !targetName) return false;
  const exactName = googleName === targetName;
  const similarName = Math.min(googleName.length, targetName.length) >= 6 &&
    (googleName.includes(targetName) || targetName.includes(googleName));
  if (!exactName && !similarName) return false;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return exactName;
  return distanceMeters(restaurant.latitude, restaurant.longitude, lat, lng) <= 350;
}

function toGoogleRestaurant(place: GooglePlace): RestaurantPlace | null {
  const name = place.displayName?.text?.trim();
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  if (!place.id || !name || typeof latitude !== "number" || typeof longitude !== "number") return null;
  const rawTypes = (place.types ?? []).filter((type) =>
    /restaurant|food|cafe|bakery|meal_takeaway|meal_delivery|bar/.test(type),
  );
  const cuisine = rawTypes
    .filter((type) => !/establishment|point_of_interest|food|restaurant$/.test(type))
    .map((type) => type.replace(/_restaurant$/, "").replace(/_/g, " "));
  const displayType = place.primaryTypeDisplayName?.text;
  if (displayType && !cuisine.length) cuisine.push(displayType);
  return {
    id: "google:" + place.id,
    sourceId: place.id,
    source: "google",
    name,
    address: place.formattedAddress ?? null,
    latitude,
    longitude,
    cuisine,
    phone: place.nationalPhoneNumber ?? null,
    websiteUrl: place.websiteUri ?? null,
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" · ") ?? null,
    wikidataId: null,
    imageUrl: null,
    imageAttribution: null,
    imageAttributionUrl: null,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    priceLevel: priceLevelNumber(place.priceLevel),
    attribution: GOOGLE_ATTRIBUTION,
  };
}

function cacheKey(input: { query: string; latitude: number; longitude: number; radius: number; enterprise: boolean }): string {
  return [
    normalizeName(input.query), input.latitude.toFixed(3), input.longitude.toFixed(3),
    input.radius, input.enterprise ? "enterprise" : "basic",
  ].join(":");
}

async function fetchSearchPage(
  apiKey: string,
  query: string,
  latitude: number,
  longitude: number,
  radius: number,
  pageToken?: string,
): Promise<GoogleSearchResponse> {
  reserveGoogleRequest();
  const response = await fetch(GOOGLE_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": env.GOOGLE_PLACES_ENTERPRISE_MODE ? ENTERPRISE_FIELDS : BASIC_FIELDS,
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
      languageCode: "fr",
      locationBias: { circle: { center: { latitude, longitude }, radius: Math.min(Math.max(radius, 100), 50000) } },
      ...(pageToken ? { pageToken } : {}),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const error = new Error("GOOGLE_PLACES_HTTP_" + response.status);
    console.warn("[Google Places] HTTP", response.status);
    throw error;
  }
  return await response.json() as GoogleSearchResponse;
}

async function resolveGooglePhoto(place: GooglePlace, apiKey: string): Promise<Pick<RestaurantPlace, "imageUrl" | "imageAttribution" | "imageAttributionUrl">> {
  const photoName = place.photos?.find((photo) => photo.name)?.name;
  if (!photoName) return { imageUrl: null, imageAttribution: null, imageAttributionUrl: null };
  try {
    reserveGoogleRequest();
    const response = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=640&skipHttpRedirect=true`, {
      headers: { "X-Goog-Api-Key": apiKey }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return { imageUrl: null, imageAttribution: null, imageAttributionUrl: null };
    const media = await response.json() as { photoUri?: string };
    const attribution = place.photos?.find((photo) => photo.name === photoName)?.authorAttributions?.find((item) => item.displayName);
    return {
      imageUrl: media.photoUri ?? null,
      imageAttribution: attribution?.displayName ?? "Google Maps",
      imageAttributionUrl: attribution?.uri ?? null,
    };
  } catch (error) {
    console.warn(error instanceof Error && error.message === "GOOGLE_PLACES_DAILY_LIMIT_REACHED" ? "[Google Places photos] daily cap reached." : "[Google Places photos] unable to retrieve a photo.");
    return { imageUrl: null, imageAttribution: null, imageAttributionUrl: null };
  }
}

async function searchGoogle(input: {
  query: string; latitude: number; longitude: number; radius: number; limit: number; offset?: number;
}): Promise<{ data: RestaurantPlace[]; hasMore: boolean }> {
  const apiKey = requireApiKey();
  const offset = input.offset ?? 0;
  const key = cacheKey({ ...input, enterprise: env.GOOGLE_PLACES_ENTERPRISE_MODE });
  let cached = searchCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) {
    cached = { expiresAt: Date.now() + CACHE_TTL_MS, pages: [] };
    searchCache.set(key, cached);
  }

  const firstPageIndex = Math.floor(offset / 20);
  const endIndex = offset + input.limit;
  const lastPageIndex = Math.floor(Math.max(0, endIndex - 1) / 20);
  const targetPageIndex = Math.min(lastPageIndex, firstPageIndex + 2);
  // Avoid an unexpectedly large offset consuming most of the daily quota just
  // to walk uncached page tokens. Normal app pagination (offset 0, then 30) works.
  const missingPages = Array.from({ length: targetPageIndex + 1 }, (_, index) => index)
    .filter((index) => !cached.pages[index]).length;
  if (missingPages > 3) throw new Error("GOOGLE_PLACES_OFFSET_NOT_AVAILABLE");
  for (let index = 0; index <= targetPageIndex; index += 1) {
    if (cached.pages[index]) continue;
    const previous = index > 0 ? cached.pages[index - 1] : undefined;
    const token = previous?.nextPageToken;
    if (index > 0 && !token) break;
    cached.pages[index] = await fetchSearchPage(apiKey, input.query, input.latitude, input.longitude, input.radius, token);
    cached.expiresAt = Date.now() + CACHE_TTL_MS;
  }

  // Photo resource names are intentionally removed before caching. Refresh the
  // requested page when cached restaurant data no longer contains photo metadata.
  // This keeps each response eligible for a fresh photo lookup without persisting
  // Google's photo resources or media URLs in our cache.
  if (env.GOOGLE_PLACES_ENTERPRISE_MODE) {
    for (let index = firstPageIndex; index <= targetPageIndex; index += 1) {
      const page = cached.pages[index];
      if (!page || (page.places ?? []).some((place) => place.photos?.some((photo) => photo.name))) continue;
      const previous = index > 0 ? cached.pages[index - 1] : undefined;
      const token = previous?.nextPageToken;
      if (index > 0 && !token) break;
      cached.pages[index] = await fetchSearchPage(apiKey, input.query, input.latitude, input.longitude, input.radius, token);
      cached.expiresAt = Date.now() + CACHE_TTL_MS;
    }
  }

  const places = cached.pages.flatMap((page) => page.places ?? []);
  const selectedPlaces = places.slice(offset, endIndex);
  const data = selectedPlaces.map(toGoogleRestaurant).filter((place): place is RestaurantPlace => place !== null);
  if (env.GOOGLE_PLACES_ENTERPRISE_MODE && data.length > 0) {
    const candidates = selectedPlaces.slice(0, Math.min(5, data.length));
    const photos = await Promise.all(candidates.map(async (place) => ({
      id: place.id ? "google:" + place.id : "",
      photo: await resolveGooglePhoto(place, apiKey),
    })));
    for (const item of photos) {
      const target = data.find((restaurant) => restaurant.id === item.id);
      if (target && item.photo.imageUrl) Object.assign(target, item.photo);
    }
  }
  // Google photo resource names must not persist in our search cache.
  for (const page of cached.pages) for (const place of page.places ?? []) delete place.photos;
  const lastFetchedPage = cached.pages[Math.min(targetPageIndex, cached.pages.length - 1)];
  const hasMore = endIndex < places.length || Boolean(lastFetchedPage?.nextPageToken);
  return { data, hasMore };
}

export async function searchGoogleNearbyRestaurants(input: {
  latitude: number; longitude: number; radius: number; limit: number; offset?: number;
}): Promise<{ data: RestaurantPlace[]; hasMore: boolean }> {
  return searchGoogle({
    query: "restaurants",
    latitude: input.latitude, longitude: input.longitude, radius: input.radius,
    limit: input.limit, offset: input.offset,
  });
}

export async function searchGoogleRestaurantsByText(input: {
  query: string; latitude: number; longitude: number; radius: number; limit: number; offset?: number;
}): Promise<{ data: RestaurantPlace[]; hasMore: boolean }> {
  return searchGoogle(input);
}

async function enrichOne(restaurant: RestaurantPlace, apiKey: string): Promise<RestaurantPlace> {
  const key = normalizeName(restaurant.name) + ":" + restaurant.latitude.toFixed(4) + ":" + restaurant.longitude.toFixed(4);
  const cached = enrichmentCache.get(key);
  // Re-run the match when we previously had no image: Google photo media URLs
  // must not be persisted in this cache, and a later request may have a photo.
  if (cached && cached.expiresAt > Date.now() &&
      (cached.value.imageUrl || restaurant.imageUrl)) return cached.value;

  reserveGoogleRequest();
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
      locationBias: { circle: { center: { latitude: restaurant.latitude, longitude: restaurant.longitude }, radius: 350 } },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.warn("[Google Places enrichment] HTTP", response.status);
    return restaurant;
  }
  const payload = await response.json() as GoogleSearchResponse;
  const place = (payload.places ?? []).filter((candidate) => matchesRestaurant(candidate, restaurant))
    .sort((a, b) => {
      const dist = (candidate: GooglePlace) => {
        const lat = candidate.location?.latitude;
        const lng = candidate.location?.longitude;
        return typeof lat === "number" && typeof lng === "number"
          ? distanceMeters(restaurant.latitude, restaurant.longitude, lat, lng)
          : Number.MAX_SAFE_INTEGER;
      };
      return dist(a) - dist(b);
    })[0];
  if (!place) {
    enrichmentCache.set(key, { expiresAt: Date.now() + ENRICHMENT_CACHE_TTL_MS, value: restaurant });
    return restaurant;
  }

  const result: RestaurantPlace = {
    ...restaurant,
    address: restaurant.address ?? place.formattedAddress ?? null,
    phone: restaurant.phone ?? place.nationalPhoneNumber ?? null,
    websiteUrl: place.websiteUri ?? restaurant.websiteUrl,
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" · ") ?? restaurant.openingHours,
    rating: typeof place.rating === "number" ? place.rating : restaurant.rating,
    reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : restaurant.reviewCount,
    priceLevel: priceLevelNumber(place.priceLevel) ?? restaurant.priceLevel,
  };
  // OSM-sourced image URLs may be cached as supplied by OSM, but never persist
  // a Google Places photo media URL in the enrichment cache.
  const cacheValue: RestaurantPlace = {
    ...result,
    imageUrl: restaurant.imageUrl,
    imageAttribution: restaurant.imageAttribution,
    imageAttributionUrl: restaurant.imageAttributionUrl,
  };
  enrichmentCache.set(key, { expiresAt: Date.now() + ENRICHMENT_CACHE_TTL_MS, value: cacheValue });

  if (!result.imageUrl && place.photos?.some((photo) => photo.name)) {
    const photo = await resolveGooglePhoto(place, apiKey);
    if (photo.imageUrl) Object.assign(result, photo);
  }
  return result;
}

/**
 * Optional enrichment for OSM results. Google requests are counted against a
 * UTC daily cap shared with Google discovery in this backend process.
 */
export async function enrichRestaurantsWithGooglePlaces(restaurants: RestaurantPlace[]): Promise<RestaurantPlace[]> {
  if (!env.GOOGLE_PLACES_ENTERPRISE_MODE || !env.GOOGLE_PLACES_API_KEY?.trim()) return restaurants;
  const apiKey = env.GOOGLE_PLACES_API_KEY.trim();
  const maxResults = env.GOOGLE_PLACES_ENRICHMENT_MAX_RESULTS;
  const toEnrich = restaurants.slice(0, maxResults);
  const enriched = await Promise.all(toEnrich.map(async (restaurant) => {
    try {
      return await enrichOne(restaurant, apiKey);
    } catch (error) {
      if (error instanceof Error && error.message === "GOOGLE_PLACES_DAILY_LIMIT_REACHED") {
        console.warn("[Google Places enrichment] daily request cap reached; remaining results are unchanged.");
        return restaurant;
      }
      console.warn("[Google Places enrichment] request failed:", error instanceof Error ? error.name : "unknown error");
      return restaurant;
    }
  }));
  return [...enriched, ...restaurants.slice(toEnrich.length)];
}
