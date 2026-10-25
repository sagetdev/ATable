type WikidataClaim = { mainsnak?: { datavalue?: { value?: unknown } } };
type WikidataEntityResponse = {
  entities?: Record<string, {
    descriptions?: Record<string, { value?: string }>;
    sitelinks?: Record<string, { url?: string }>;
    claims?: Record<string, WikidataClaim[]>;
  }>;
};
type CommonsImageInfo = {
  url?: string;
  descriptionurl?: string;
  thumburl?: string;
  extmetadata?: Record<string, { value?: string }>;
};
type CommonsResponse = { query?: { pages?: Record<string, { imageinfo?: CommonsImageInfo[] }> } };

export type WikidataEnrichment = {
  id: string;
  description: string | null;
  wikipediaUrl: string | null;
  officialWebsite: string | null;
  imageUrl: string | null;
  imageSourceUrl: string | null;
  imageLicense: string | null;
  imageArtist: string | null;
  imageCredit: string | null;
};

const ENTITY_ID_PATTERN = /^Q[1-9][0-9]*$/;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const enrichmentCache = new Map<string, { expiresAt: number; value: WikidataEnrichment | null }>();

function claimValue(claims: Record<string, WikidataClaim[]> | undefined, property: string): string | null {
  const value = claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function plainText(value: string | undefined): string | null {
  if (!value) return null;
  const text = value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "&#39;")
    .replace(/&quot;/g, '"')
    .trim();
  return text || null;
}

async function getCommonsImage(filename: string): Promise<Pick<WikidataEnrichment, "imageUrl" | "imageSourceUrl" | "imageLicense" | "imageArtist" | "imageCredit">> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    titles: "File:" + filename,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1200",
    format: "json",
  }).toString();
  const empty = { imageUrl: null, imageSourceUrl: null, imageLicense: null, imageArtist: null, imageCredit: null };

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ATable/1.0 (restaurant discovery app; Wikimedia Commons metadata)",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return empty;
    const payload = (await response.json()) as CommonsResponse;
    const page = Object.values(payload.query?.pages ?? {})[0];
    const image = page?.imageinfo?.[0];
    if (!image) return empty;
    const metadata = image.extmetadata ?? {};
    return {
      imageUrl: image.thumburl ?? image.url ?? null,
      imageSourceUrl: image.descriptionurl ?? null,
      imageLicense: plainText(metadata.LicenseShortName?.value) ?? plainText(metadata.UsageTerms?.value),
      imageArtist: plainText(metadata.Artist?.value),
      imageCredit: plainText(metadata.Credit?.value),
    };
  } catch {
    return empty;
  }
}

export async function getWikidataEnrichment(entityId: string): Promise<WikidataEnrichment | null> {
  if (!ENTITY_ID_PATTERN.test(entityId)) return null;
  const cached = enrichmentCache.get(entityId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const url = new URL("https://www.wikidata.org/w/api.php");
  url.search = new URLSearchParams({
    action: "wbgetentities",
    ids: entityId,
    props: "labels|descriptions|sitelinks|claims",
    languages: "fr|en",
    languagefallback: "1",
    format: "json",
  }).toString();
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ATable/1.0 (restaurant discovery app)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("WIKIDATA_HTTP_" + response.status);

  const payload = (await response.json()) as WikidataEntityResponse;
  const entity = payload.entities?.[entityId];
  if (!entity) {
    enrichmentCache.set(entityId, { expiresAt: Date.now() + CACHE_TTL_MS, value: null });
    return null;
  }

  const filename = claimValue(entity.claims, "P18");
  const image = filename ? await getCommonsImage(filename) : {
    imageUrl: null, imageSourceUrl: null, imageLicense: null, imageArtist: null, imageCredit: null,
  };
  const result: WikidataEnrichment = {
    id: entityId,
    description: entity.descriptions?.fr?.value ?? entity.descriptions?.en?.value ?? null,
    wikipediaUrl: entity.sitelinks?.frwiki?.url ?? entity.sitelinks?.enwiki?.url ?? null,
    officialWebsite: claimValue(entity.claims, "P856"),
    ...image,
  };
  enrichmentCache.set(entityId, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });
  return result;
}
