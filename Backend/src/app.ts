import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env";

import { restaurantSearchLimiter } from "./middleware/rate-limit";

import healthRoutes from "./routes/health.routes";
import restaurantRoutes from "./routes/restaurants.routes";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Les applications mobiles natives peuvent ne pas envoyer Origin.
      if (!origin || origin === env.FRONTEND_ORIGIN) {
        return callback(null, true);
      }

      return callback(new Error("Origin non autorisée par CORS"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "À Table API",
    version: "1.0.0",
    documentation: "/api/v1/health",
  });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/restaurants", restaurantSearchLimiter);
app.use("/api/v1/restaurants", restaurantRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route introuvable.",
    },
  });
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[API]", error.message);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Une erreur interne est survenue.",
      },
    });
  },
);

export default app;
