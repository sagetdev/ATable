
import { env } from "../config/env";

const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.rating",
  "places.priceLevel",
  "places.websiteUri",
].join(",");

export type RestaurantPlace = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  priceLevel: string | null;
  types: string[];
  websiteUrl: string | null;
  source: "google_places";
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  types?: string[];
  rating?: number;
  priceLevel?: string;
  websiteUri?: string;
};

type GooglePlacesResponse = {
  places?: GooglePlace[];
};

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY n'est pas configurée.");
  }

  return key;
}


async function googlePost(
  endpoint: string,
  body: Record<string, unknown>
): Promise<GooglePlacesResponse> {
  let response: Response;

  try {
    response = await fetch(
      `${GOOGLE_PLACES_BASE_URL}/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": getApiKey(),
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "TimeoutError"
    ) {
      throw new Error("GOOGLE_PLACES_TIMEOUT");
    }

    throw new Error("GOOGLE_PLACES_NETWORK_ERROR");
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("GOOGLE_PLACES_QUOTA_EXCEEDED");
    }

    if (response.status >= 500) {
      throw new Error("GOOGLE_PLACES_UNAVAILABLE");
    }

    // Ne pas exposer la réponse Google ni la clé au client.
    console.error("Google Places HTTP status:", response.status);
    throw new Error("GOOGLE_PLACES_REQUEST_FAILED");
  }

  try {
    return (await response.json()) as GooglePlacesResponse;
  } catch {
    throw new Error("GOOGLE_PLACES_INVALID_RESPONSE");
  }
}


function normalizePlace(place: GooglePlace): RestaurantPlace | null {
  if (!place.id || !place.displayName?.text) {
    return null;
  }

  return {
    id: place.id,
    name: place.displayName.text,
    address: place.formattedAddress ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    rating: place.rating ?? null,
    priceLevel: place.priceLevel ?? null,
    types: place.types ?? [],
    websiteUrl: place.websiteUri ?? null,
    source: "google_places",
  };
}

export async function searchNearbyRestaurants(input: {
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
}): Promise<RestaurantPlace[]> {
  const result = await googlePost("places:searchNearby", {
    includedTypes: ["restaurant"],
    maxResultCount: input.limit,
    rankPreference: "DISTANCE",
    locationRestriction: {
      circle: {
        center: {
          latitude: input.latitude,
          longitude: input.longitude,
        },
        radius: input.radius,
      },
    },
  });

  return (result.places ?? [])
    .map(normalizePlace)
    .filter((place): place is RestaurantPlace => place !== null);
}

export async function searchRestaurantsByText(input: {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit: number;
}): Promise<RestaurantPlace[]> {
  const body: Record<string, unknown> = {
    textQuery: input.query,
    includedType: "restaurant",
    strictTypeFiltering: true,
    pageSize: input.limit,
    languageCode: "fr",
  };

  if (
    input.latitude !== undefined &&
    input.longitude !== undefined
  ) {
    body.locationBias = {
      circle: {
        center: {
          latitude: input.latitude,
          longitude: input.longitude,
        },
        radius: input.radius ?? 5000,
      },
    };
  }

  const result = await googlePost("places:searchText", body);

  return (result.places ?? [])
    .map(normalizePlace)
    .filter((place): place is RestaurantPlace => place !== null);
}
