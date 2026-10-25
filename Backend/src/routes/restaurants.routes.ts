import { Router } from "express";
import { z } from "zod";
import {
  searchNearbyRestaurants,
  searchRestaurantsByText,
} from "../services/openstreetmap.service";
import { getWikidataEnrichment } from "../services/wikidata.service";
import { getFoursquareEnrichment } from "../services/foursquare.service";
import { enrichRestaurantsWithGooglePlaces } from "../services/google-places.service";

const router = Router();

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(10000).default(2000),
  limit: z.coerce.number().int().min(1).max(30).default(20),
  offset: z.coerce.number().int().min(0).max(500).default(0),
});
const textSearchSchema = z.object({
  q: z.string().trim().min(2).max(100),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(10000).default(5000),
  limit: z.coerce.number().int().min(1).max(30).default(20),
  offset: z.coerce.number().int().min(0).max(500).default(0),
});
const ratingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

function providerError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("TIMEOUT")) return {
    status: 504, code: "RESTAURANT_PROVIDER_TIMEOUT",
    message: "La recherche prend trop de temps. Réessaie dans un instant.",
  };
  if (message.includes("429") || message.includes("503") || message.includes("504")) return {
    status: 503, code: "RESTAURANT_PROVIDER_BUSY",
    message: "Le service de recherche est temporairement occupé. Réessaie plus tard.",
  };
  if (message.includes("FOURSQUARE_DAILY_LIMIT_REACHED")) return {
    status: 429, code: "FOURSQUARE_DAILY_LIMIT_REACHED",
    message: "La limite quotidienne d'enrichissements Foursquare est atteinte.",
  };
  return {
    status: 502, code: "RESTAURANT_PROVIDER_ERROR",
    message: "Impossible de récupérer les informations complémentaires pour le moment.",
  };
}

router.get("/nearby", async (req, res) => {
  const parsed = nearbySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({
    success: false,
    error: { code: "INVALID_PARAMETERS", message: "Coordonnées, rayon, limite ou pagination invalides." },
  });

  try {
    const result = await searchNearbyRestaurants({
      latitude: parsed.data.lat, longitude: parsed.data.lng, radius: parsed.data.radius,
      limit: parsed.data.limit, offset: parsed.data.offset,
    });
    const data = await enrichRestaurantsWithGooglePlaces(result.data);
    return res.json({
      success: true,
      data,
      meta: {
        total: result.data.length, limit: parsed.data.limit, offset: parsed.data.offset,
        hasMore: result.hasMore, source: "openstreetmap",
        attribution: "© OpenStreetMap contributors",
      },
    });
  } catch (error) {
    console.error("[Restaurants nearby]", error);
    const failure = providerError(error);
    return res.status(failure.status).json({ success: false, error: { code: failure.code, message: failure.message } });
  }
});

router.get("/search", async (req, res) => {
  const parsed = textSearchSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({
    success: false,
    error: { code: "INVALID_PARAMETERS", message: "Une recherche, des coordonnées et une pagination valides sont nécessaires." },
  });

  try {
    const result = await searchRestaurantsByText({
      query: parsed.data.q, latitude: parsed.data.lat, longitude: parsed.data.lng,
      radius: parsed.data.radius, limit: parsed.data.limit, offset: parsed.data.offset,
    });
    const data = await enrichRestaurantsWithGooglePlaces(result.data);
    return res.json({
      success: true,
      data,
      meta: {
        total: result.data.length, limit: parsed.data.limit, offset: parsed.data.offset,
        hasMore: result.hasMore, source: "openstreetmap",
        attribution: "© OpenStreetMap contributors",
      },
    });
  } catch (error) {
    console.error("[Restaurants search]", error);
    const failure = providerError(error);
    return res.status(failure.status).json({ success: false, error: { code: failure.code, message: failure.message } });
  }
});

// Optionnel : Foursquare n'est appelé que si FOURSQUARE_API_KEY est configurée.
router.get("/rating", async (req, res) => {
  const parsed = ratingSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({
    success: false,
    error: { code: "INVALID_PARAMETERS", message: "Nom et coordonnées valides requis." },
  });

  try {
    const data = await getFoursquareEnrichment({
      name: parsed.data.name, latitude: parsed.data.lat, longitude: parsed.data.lng,
    });
    return res.json({
      success: true,
      data,
      meta: { source: data ? "foursquare" : "unavailable" },
    });
  } catch (error) {
    console.error("[Foursquare enrichment]", error);
    const failure = providerError(error);
    const status = failure.code === "FOURSQUARE_DAILY_LIMIT_REACHED" ? 429 : failure.status;
    return res.status(status).json({ success: false, error: { code: failure.code, message: failure.message } });
  }
});

router.get("/wikidata/:entityId", async (req, res) => {
  const entityId = req.params.entityId;
  if (!/^Q[1-9][0-9]*$/.test(entityId)) return res.status(400).json({
    success: false,
    error: { code: "INVALID_WIKIDATA_ID", message: "L'identifiant Wikidata doit être au format Q123." },
  });

  try {
    const data = await getWikidataEnrichment(entityId);
    if (!data) return res.status(404).json({
      success: false,
      error: { code: "WIKIDATA_ENTITY_NOT_FOUND", message: "Aucune information complémentaire trouvée." },
    });
    return res.json({ success: true, data, meta: { source: "wikidata", attribution: "Wikidata · Wikimedia Commons" } });
  } catch (error) {
    console.error("[Wikidata enrichment]", error);
    return res.status(502).json({
      success: false,
      error: { code: "WIKIDATA_PROVIDER_ERROR", message: "Les informations complémentaires sont temporairement indisponibles." },
    });
  }
});

export default router;
