import { Router } from "express";

export function createLeaderboardRouter(controller) {
  const router = Router();

  router.get("/leaderboard", controller.getTop);
  router.post("/leaderboard", controller.create);

  return router;
}
