const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export type RestaurantPlace = {
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
  priceLevel: null;
  attribution: "© OpenStreetMap contributors";
};

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OsmElement[] };

function escapeOverpassRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
}

function elementCoordinates(element: OsmElement) {
  return {
    latitude: element.lat ?? element.center?.lat,
    longitude: element.lon ?? element.center?.lon,
  };
}

function normalizeElement(element: OsmElement): RestaurantPlace | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  const coordinates = elementCoordinates(element);

  if (!name || coordinates.latitude === undefined || coordinates.longitude === undefined) {
    return null;
  }

  const street = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ");
  const locality = [tags["addr:postcode"], tags["addr:city"]]
    .filter(Boolean)
    .join(" ");

  return {
    id: `osm:${element.type}:${element.id}`,
    sourceId: `${element.type}/${element.id}`,
    source: "openstreetmap",
    name,
    address: [street, locality, tags["addr:suburb"]]
      .filter(Boolean)
      .join(", ") || null,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    cuisine: (tags.cuisine ?? "").split(";").map((value) => value.trim()).filter(Boolean),
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    websiteUrl: tags.website ?? tags["contact:website"] ?? null,
    openingHours: tags.opening_hours ?? null,
    wikidataId: tags.wikidata ?? null,
    imageUrl: null,
    rating: null,
    priceLevel: null,
    attribution: "© OpenStreetMap contributors",
  };
}

async function executeOverpass(query: string): Promise<OverpassResponse> {
  let lastError: unknown;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "ATable/1.0 (restaurant discovery app)",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 429 || response.status === 504 || response.status >= 500) {
        lastError = new Error(`OVERPASS_HTTP_${response.status}`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`OVERPASS_HTTP_${response.status}`);
      }

      return (await response.json()) as OverpassResponse;
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        lastError = new Error("OVERPASS_TIMEOUT");
      } else {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OVERPASS_UNAVAILABLE");
}

export async function searchNearbyRestaurants(input: {
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
  offset?: number;
}): Promise<{ data: RestaurantPlace[]; hasMore: boolean }> {
  const offset = input.offset ?? 0;
  const query = `
[out:json][timeout:12];
(
  node["amenity"~"^(restaurant|fast_food|food_court)$"](around:${input.radius},${input.latitude},${input.longitude});
  way["amenity"~"^(restaurant|fast_food|food_court)$"](around:${input.radius},${input.latitude},${input.longitude});
  relation["amenity"~"^(restaurant|fast_food|food_court)$"](around:${input.radius},${input.latitude},${input.longitude});
);
out tags center ${input.limit + 1} ${offset};
`;

  const response = await executeOverpass(query);
  const elements = response.elements ?? [];
  const hasMore = elements.length > input.limit;

  const data = elements
    .slice(0, input.limit)
    .map(normalizeElement)
    .filter((place): place is RestaurantPlace => place !== null);

  return { data, hasMore };
}

export async function searchRestaurantsByText(input: {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit: number;
  offset?: number;
}): Promise<{ data: RestaurantPlace[]; hasMore: boolean }> {
  const namePattern = escapeOverpassRegex(input.query);
  const offset = input.offset ?? 0;
  const nearby = input.latitude !== undefined && input.longitude !== undefined;

  const locationFilter = nearby
    ? `(around:${input.radius ?? 5000},${input.latitude},${input.longitude})`
    : "";

  const query = `
[out:json][timeout:12];
(
  node["amenity"~"^(restaurant|fast_food|food_court)$"]["name"~"${namePattern}",i]${locationFilter};
  way["amenity"~"^(restaurant|fast_food|food_court)$"]["name"~"${namePattern}",i]${locationFilter};
  relation["amenity"~"^(restaurant|fast_food|food_court)$"]["name"~"${namePattern}",i]${locationFilter};
);
out tags center ${input.limit + 1} ${offset};
`;

  const response = await executeOverpass(query);
  const elements = response.elements ?? [];
  const hasMore = elements.length > input.limit;

  const data = elements
    .slice(0, input.limit)
    .map(normalizeElement)
    .filter((place): place is RestaurantPlace => place !== null);

  return { data, hasMore };
}
