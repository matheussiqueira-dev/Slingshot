import { Router } from "express";

export function createHealthRouter() {
  const router = Router();

  router.get("/health", (req, res) => {
    res.status(200).json({
      data: {
        status: "ok",
        service: "slingshot-api",
        timestamp: new Date().toISOString(),
      },
    });
  });

  return router;
}
