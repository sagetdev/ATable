import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:8081"),
  // Optionnel : sans clé, les sources gratuites restent disponibles.
  FOURSQUARE_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
