import type { Restaurant } from "@/data/restaurants";

export type ApiRestaurant = {
  id: string;
  sourceId: string;
  source: "openstreetmap";
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  cuisine: string[];
  phone: string | null;
  websiteUrl: string | null;
  openingHours: string | null;
  wikidataId: string | null;
  imageUrl: string | null;
  rating: number | null;
  priceLevel: number | null;
  attribution: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  meta?: { hasMore?: boolean; attribution?: string; source?: string };
  error?: { code?: string; message?: string };
};

export type RestaurantPage = {
  restaurants: Restaurant[];
  hasMore: boolean;
  attribution: string;
};

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4000/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ApiError("Le serveur met trop de temps à répondre. Réessaie.");
    }
    throw new ApiError("Impossible de joindre À Table. Vérifie que le backend est démarré et que l’URL API est correcte.");
  }

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("Le serveur a renvoyé une réponse invalide.", response.status);
  }

  if (!response.ok || !body.success) {
    throw new ApiError(body.error?.message || "Une erreur est survenue.", response.status, body.error?.code);
  }
  return body;
}

export function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(toLat - fromLat);
  const dLng = radians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cuisineLabel(cuisines: string[]) {
  if (!cuisines.length) return "Restaurant";
  return cuisines.map((value) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())).join(" · ");
}

function emojiFor(cuisines: string[]) {
  const value = cuisines.join(" ").toLowerCase();
  if (/pizza|italian|pasta/.test(value)) return "🍕";
  if (/japanese|sushi|ramen/.test(value)) return "🍣";
  if (/burger|american|fast_food/.test(value)) return "🍔";
  if (/coffee|cafe/.test(value)) return "☕";
  if (/vegetarian|vegan|salad/.test(value)) return "🥗";
  if (/indian|curry/.test(value)) return "🍛";
  if (/mexican|taco/.test(value)) return "🌮";
  if (/chinese|thai|asian|korean/.test(value)) return "🍜";
  return "🍽️";
}

function toRestaurant(place: ApiRestaurant, lat: number, lng: number): Restaurant {
  const cuisine = cuisineLabel(place.cuisine);
  const cuisineAliases: Record<string, string> = {
    italian: "Italien", japanese: "Japonais", chinese: "Chinois", thai: "Thaï",
    mexican: "Mexicain", french: "Français", korean: "Coréen", vietnamese: "Vietnamien",
    indian: "Indien", vegetarian: "Végétarien", vegan: "Végétarien", pizza: "Italien",
    seafood: "Fruits de mer", burger: "Burger", regional: "Local",
  };
  const categories = place.cuisine.length
    ? place.cuisine.map((value) => cuisineAliases[value.toLowerCase()] ?? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()))
    : ["Restaurant"];
  const price = (place.priceLevel && place.priceLevel >= 1 && place.priceLevel <= 4 ? place.priceLevel : 1) as 1 | 2 | 3 | 4;
  return {
    id: place.id,
    name: place.name,
    emoji: emojiFor(place.cuisine),
    tone: "mint",
    cuisine,
    descriptor: cuisine,
    categories,
    price,
    priceKnown: place.priceLevel !== null,
    rating: place.rating ?? 0,
    distanceKm: distanceKm(lat, lng, place.latitude, place.longitude),
    address: place.address ?? undefined,
    website: place.websiteUrl ?? undefined,
    about: "Informations issues d’OpenStreetMap. Les notes, menus, horaires et prix ne sont pas toujours renseignés.",
    latitude: place.latitude,
    longitude: place.longitude,
    phone: place.phone ?? undefined,
    openingHours: place.openingHours ?? undefined,
    wikidataId: place.wikidataId ?? undefined,
    imageUrl: place.imageUrl ?? undefined,
    attribution: place.attribution,
  };
}

function buildParams(params: Record<string, string | number>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  return search.toString();
}

export async function getNearbyRestaurants(input: {
  latitude: number; longitude: number; radiusKm: number; limit?: number; offset?: number;
}): Promise<RestaurantPage> {
  const query = buildParams({
    lat: input.latitude, lng: input.longitude, radius: Math.round(input.radiusKm * 1000),
    limit: input.limit ?? 30, offset: input.offset ?? 0,
  });
  const response = await request<ApiRestaurant[]>(`/restaurants/nearby?${query}`);
  return {
    restaurants: (response.data ?? []).map((place) => toRestaurant(place, input.latitude, input.longitude)),
    hasMore: !!response.meta?.hasMore,
    attribution: response.meta?.attribution ?? "© OpenStreetMap contributors",
  };
}

export async function searchRestaurants(input: {
  query: string; latitude: number; longitude: number; radiusKm: number; limit?: number; offset?: number;
}): Promise<RestaurantPage> {
  const query = buildParams({
    q: input.query, lat: input.latitude, lng: input.longitude, radius: Math.round(input.radiusKm * 1000),
    limit: input.limit ?? 30, offset: input.offset ?? 0,
  });
  const response = await request<ApiRestaurant[]>(`/restaurants/search?${query}`);
  return {
    restaurants: (response.data ?? []).map((place) => toRestaurant(place, input.latitude, input.longitude)),
    hasMore: !!response.meta?.hasMore,
    attribution: response.meta?.attribution ?? "© OpenStreetMap contributors",
  };
}

export async function getWikidataDetails(entityId: string) {
  const response = await request<Record<string, unknown>>(`/restaurants/wikidata/${encodeURIComponent(entityId)}`);
  return response.data;
}
