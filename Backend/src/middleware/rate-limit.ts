
import { rateLimit } from "express-rate-limit";

export const restaurantSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Trop de recherches. Réessaie dans une minute.",
    },
  },
});
