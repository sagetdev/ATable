
import { Router } from "express";
import { z } from "zod";
import {
  searchNearbyRestaurants,
  searchRestaurantsByText,
} from "../services/google-places.service";

const router = Router();

const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(50000).default(3000),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const textSearchSchema = z.object({
  q: z.string().trim().min(2).max(150),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(100).max(50000).default(5000),
  limit: z.coerce.number().int().min(1).max(20).default(10),
}).refine(
  (value) =>
    (value.lat === undefined && value.lng === undefined) ||
    (value.lat !== undefined && value.lng !== undefined),
  { message: "lat et lng doivent être fournis ensemble." }
);

router.get("/nearby", async (req, res) => {
  const parsed = coordinatesSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PARAMETERS",
        message: "Coordonnées ou filtres invalides.",
      },
    });
  }

  try {
    const data = await searchNearbyRestaurants({
      latitude: parsed.data.lat,
      longitude: parsed.data.lng,
      radius: parsed.data.radius,
      limit: parsed.data.limit,
    });

    return res.json({
      success: true,
      data,
      meta: {
        total: data.length,
        source: "google_places",
      },
    });
  } catch (error) {
    console.error("[Restaurants nearby]", error);

    return res.status(502).json({
      success: false,
      error: {
        code: "RESTAURANT_PROVIDER_ERROR",
        message: "Impossible de récupérer les restaurants pour le moment.",
      },
    });
  }
});

router.get("/search", async (req, res) => {
  const parsed = textSearchSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PARAMETERS",
        message: "Requête de recherche invalide.",
      },
    });
  }

  try {
    const data = await searchRestaurantsByText({
      query: parsed.data.q,
      latitude: parsed.data.lat,
      longitude: parsed.data.lng,
      radius: parsed.data.radius,
      limit: parsed.data.limit,
    });

    return res.json({
      success: true,
      data,
      meta: {
        total: data.length,
        source: "google_places",
      },
    });
  } catch (error) {
    console.error("[Restaurants search]", error);

    return res.status(502).json({
      success: false,
      error: {
        code: "RESTAURANT_PROVIDER_ERROR",
        message: "La recherche de restaurants a échoué.",
      },
    });
  }
});

export default router;
