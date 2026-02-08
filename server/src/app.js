import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { env as envDefaults } from "./config/env.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.js";
import { notFoundMiddleware } from "./middleware/not-found.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { LeaderboardController } from "./modules/leaderboard/leaderboard.controller.js";
import { LeaderboardRepository } from "./modules/leaderboard/leaderboard.repository.js";
import { createLeaderboardRouter } from "./modules/leaderboard/leaderboard.routes.js";
import { LeaderboardService } from "./modules/leaderboard/leaderboard.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(options = {}) {
  const effectiveEnv = {
    ...envDefaults,
    ...(options.env || {}),
  };

  const repository = options.repository || new LeaderboardRepository(effectiveEnv.leaderboardFile);
  const leaderboardService = new LeaderboardService(repository);
  const leaderboardController = new LeaderboardController(leaderboardService);

  const app = express();

  app.disable("x-powered-by");

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: effectiveEnv.corsOrigin === "*" ? true : effectiveEnv.corsOrigin,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.use(
    rateLimit({
      windowMs: effectiveEnv.rateLimitWindowMs,
      max: effectiveEnv.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMIT",
          message: "Muitas requisições. Tente novamente em instantes.",
        },
      },
    }),
  );

  app.use(express.json({ limit: "24kb" }));
  app.use(requestIdMiddleware);

  morgan.token("request-id", (req) => req.requestId || "-");
  app.use(
    morgan(':method :url :status :response-time ms reqId=:request-id', {
      skip: () => effectiveEnv.nodeEnv === "test",
    }),
  );

  const apiRouter = express.Router();
  apiRouter.use(createHealthRouter());
  apiRouter.use(createLeaderboardRouter(leaderboardController));

  app.use("/api/v1", apiRouter);

  const clientDirectory = path.resolve(__dirname, "..", "..", "..", "client");
  app.use(express.static(clientDirectory));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    return res.sendFile(path.join(clientDirectory, "index.html"));
  });

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
