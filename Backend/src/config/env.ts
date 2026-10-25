import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:8081"),
  // Optionnel : sans clé, les sources gratuites restent disponibles.
  FOURSQUARE_API_KEY: z.string().optional(),
  // Enterprise fields can incur Google Places Enterprise SKU charges: explicitly opt in.
  GOOGLE_PLACES_ENTERPRISE_MODE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_PLACES_ENRICHMENT_MAX_RESULTS: z.coerce.number().int().min(0).max(10).default(5),
});

export const env = envSchema.parse(process.env);
