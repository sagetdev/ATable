// Public Overpass instances are best-effort and may be busy. Try independent
// providers so a temporary outage of one host does not block restaurant search.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
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
  reviewCount: number | null;
  priceLevel: number | null;
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
    address: [street, locality, tags["addr:suburb"]].filter(Boolean).join(", ") || null,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    cuisine: (tags.cuisine ?? "").split(";").map((value) => value.trim()).filter(Boolean),
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    websiteUrl: tags.website ?? tags["contact:website"] ?? null,
    openingHours: tags.opening_hours ?? null,
    wikidataId: tags.wikidata ?? null,
    imageUrl: null,
    rating: null,
    reviewCount: null,
    priceLevel: null,
    attribution: "© OpenStreetMap contributors",
  };
}

async function executeOverpass(query: string): Promise<OverpassResponse> {
  // Never queue mirrors sequentially: one slow provider used to add 9 seconds
  // per mirror and could push the API route over the hosting request deadline.
  const requests = OVERPASS_ENDPOINTS.map(async (endpoint) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "ATable/1.0 (restaurant discovery app)",
        Accept: "application/json",
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(6500),
    });

    if (!response.ok) {
      throw new Error(`OVERPASS_HTTP_${response.status}`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("OVERPASS_INVALID_RESPONSE");
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      !Array.isArray((payload as OverpassResponse).elements)
    ) {
      throw new Error("OVERPASS_INVALID_RESPONSE");
    }

    return payload as OverpassResponse;
  });

  const results = await Promise.allSettled(requests);

  // Prefer a mirror that actually returned results. A fast, empty mirror
  // should not hide data returned by another mirror.
  for (const result of results) {
    if (result.status === "fulfilled" && (result.value.elements?.length ?? 0) > 0) {
      return result.value;
    }
  }

  // An empty result is still a valid search result if every responding mirror
  // found nothing. Only report provider failure when all mirrors failed.
  const emptyResponse = results.find(
    (result): result is PromiseFulfilledResult<OverpassResponse> =>
      result.status === "fulfilled",
  );
  if (emptyResponse) return emptyResponse.value;

  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);
  const timeout = errors.some(
    (error) => error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError"),
  );
  if (timeout) throw new Error("OVERPASS_TIMEOUT");

  const statusError = errors.find(
    (error) => error instanceof Error && /OVERPASS_HTTP_(429|502|503|504|5\d\d)/.test(error.message),
  );
  if (statusError instanceof Error) throw statusError;

  throw errors.find((error) => error instanceof Error) instanceof Error
    ? errors.find((error) => error instanceof Error) as Error
    : new Error("OVERPASS_UNAVAILABLE");
}

function paginateElements(elements: OsmElement[], limit: number, offset = 0) {
  // Overpass QL ne prend pas en charge limit/offset dans la commande out.
  // La pagination est donc appliquée après réception des résultats.
  const normalized = elements
    .map(normalizeElement)
    .filter((place): place is RestaurantPlace => place !== null);
  const data = normalized.slice(offset, offset + limit);
  return { data, hasMore: normalized.length > offset + limit };
}

function buildAmenityQuery(locationFilter: string, namePattern?: string): string {
  const nameFilter = namePattern === undefined ? "" : `["name"~"${namePattern}",i]`;
  return `
[out:json][timeout:8];
(
  node["amenity"~"^(restaurant|fast_food|food_court)$"]${nameFilter}${locationFilter};
  way["amenity"~"^(restaurant|fast_food|food_court)$"]${nameFilter}${locationFilter};
  relation["amenity"~"^(restaurant|fast_food|food_court)$"]${nameFilter}${locationFilter};
);
out tags center;
`;
}

export async function searchNearbyRestaurants(input: {
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
  offset?: number;
}): Promise<{ data: RestaurantPlace[]; hasMore: boolean }> {
  const locationFilter = `(around:${input.radius},${input.latitude},${input.longitude})`;
  const response = await executeOverpass(buildAmenityQuery(locationFilter));
  return paginateElements(response.elements ?? [], input.limit, input.offset ?? 0);
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
  const nearby = input.latitude !== undefined && input.longitude !== undefined;
  if (!nearby) {
    throw new Error("OVERPASS_LOCATION_REQUIRED");
  }

  const locationFilter = `(around:${input.radius ?? 5000},${input.latitude},${input.longitude})`;
  const response = await executeOverpass(buildAmenityQuery(locationFilter, namePattern));
  return paginateElements(response.elements ?? [], input.limit, input.offset ?? 0);
}
