import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "atable-backend",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
