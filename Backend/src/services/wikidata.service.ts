type WikidataEntityResponse = {
  entities?: Record<string, {
    id?: string;
    descriptions?: Record<string, { value?: string }>;
    labels?: Record<string, { value?: string }>;
    sitelinks?: Record<string, { url?: string }>;
    claims?: Record<string, unknown[]>;
  }>;
};

export type WikidataEnrichment = {
  id: string;
  description: string | null;
  wikipediaUrl: string | null;
  officialWebsite: string | null;
};

const ENTITY_ID_PATTERN = /^Q[1-9][0-9]*$/;

export async function getWikidataEnrichment(
  entityId: string
): Promise<WikidataEnrichment | null> {
  if (!ENTITY_ID_PATTERN.test(entityId)) return null;

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
    headers: {
      Accept: "application/json",
      "User-Agent": "ATable/1.0 (restaurant discovery app)",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`WIKIDATA_HTTP_${response.status}`);
  }

  const payload = (await response.json()) as WikidataEntityResponse;
  const entity = payload.entities?.[entityId];
  if (!entity) return null;

  const websiteClaim = entity.claims?.P856?.[0] as {
    mainsnak?: { datavalue?: { value?: string } };
  } | undefined;

  const wikipediaUrl =
    entity.sitelinks?.frwiki?.url ??
    entity.sitelinks?.enwiki?.url ??
    null;

  return {
    id: entityId,
    description:
      entity.descriptions?.fr?.value ??
      entity.descriptions?.en?.value ??
      null,
    wikipediaUrl,
    officialWebsite: websiteClaim?.mainsnak?.datavalue?.value ?? null,
  };
}
