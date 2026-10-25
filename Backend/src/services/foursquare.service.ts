import { env } from "../config/env";

type Photo = { prefix?: string; suffix?: string; attribution?: { name?: string; url?: string } };
type Place = { name?: string; rating?: number; website?: string; distance?: number; photos?: Photo[] };
type SearchResponse = { results?: Place[] };

export type FoursquareEnrichment = {
  rating: number | null;
  ratingScale: "10";
  websiteUrl: string | null;
  imageUrl: string | null;
  imageAttribution: string | null;
  imageSourceUrl: string | null;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const DAILY_LIMIT = 20;
const cache = new Map<string, { expiresAt: number; value: FoursquareEnrichment | null }>();
let requestsToday = 0;
let counterDay = new Date().toISOString().slice(0, 10);

function normalizedName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Optional enrichment. No API key means no Foursquare requests.
 * Cached for one hour and capped at 20 provider requests/day per backend process.
 */
export async function getFoursquareEnrichment(input: {
  name: string;
  latitude: number;
  longitude: number;
}): Promise<FoursquareEnrichment | null> {
  const apiKey = env.FOURSQUARE_API_KEY?.trim();
  if (!apiKey) return null;

  const cacheKey = normalizedName(input.name) + ":" + input.latitude.toFixed(3) + ":" + input.longitude.toFixed(3);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const today = new Date().toISOString().slice(0, 10);
  if (today !== counterDay) {
    counterDay = today;
    requestsToday = 0;
  }
  if (requestsToday >= DAILY_LIMIT) throw new Error("FOURSQUARE_DAILY_LIMIT_REACHED");

  const url = new URL("https://places-api.foursquare.com/places/search");
  url.search = new URLSearchParams({
    query: input.name,
    ll: input.latitude + "," + input.longitude,
    radius: "500",
    limit: "5",
    fields: "fsq_place_id,name,rating,website,photos,distance",
  }).toString();

  requestsToday += 1;
  const response = await fetch(url, {
    headers: { Accept: "application/json", Authorization: "Bearer " + apiKey, "X-Places-Api-Version": "2025-06-17" },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error("FOURSQUARE_HTTP_" + response.status);

  const payload = (await response.json()) as SearchResponse;
  const targetName = normalizedName(input.name);
  const candidate = (payload.results ?? [])
    .filter((place) => {
      if (!place.name || (place.distance !== undefined && place.distance > 250)) return false;
      const name = normalizedName(place.name);
      return name === targetName ||
        (Math.min(name.length, targetName.length) >= 5 && (name.includes(targetName) || targetName.includes(name)));
    })
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))[0];

  if (!candidate) {
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: null });
    return null;
  }

  const photo = candidate.photos?.[0];
  const result: FoursquareEnrichment = {
    rating: typeof candidate.rating === "number" ? candidate.rating : null,
    ratingScale: "10",
    websiteUrl: candidate.website ?? null,
    imageUrl: photo?.prefix && photo.suffix ? photo.prefix + "512" + photo.suffix : null,
    imageAttribution: photo?.attribution?.name ?? (photo ? "Foursquare" : null),
    imageSourceUrl: photo?.attribution?.url ?? null,
  };
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });
  return result;
}
