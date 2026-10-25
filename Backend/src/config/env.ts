import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:8081"),
  FOURSQUARE_API_KEY: z.string().optional(),
  RESTAURANT_PROVIDER_MODE: z.enum(["multi", "google", "openstreetmap"]).default("multi"),
  // Enterprise fields can incur Google Places SKU charges: explicitly opt in.
  GOOGLE_PLACES_ENTERPRISE_MODE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_PLACES_ENRICHMENT_MAX_RESULTS: z.coerce.number().int().min(0).max(10).default(5),
  // Safety cap per UTC day and backend process; use shared storage for multiple instances.
  GOOGLE_PLACES_MAX_REQUESTS_PER_DAY: z.coerce.number().int().min(0).max(10000).default(40),
});

export const env = envSchema.parse(process.env);
